// Lightweight, dependency-free tokenizers for y-code.
//
// Each language exports a function `(source: string) => Token[]` where
// `Token` is `{ type: string | null, text: string }`. A `null` type means
// "plain text / whitespace" — render without a class.
//
// The output is intentionally Prism-compatible at the class-name level
// (keyword, string, comment, function, number, operator, punctuation,
// boolean, constant, regex, class-name, property, attr-value, selector,
// important, etc.) so the syntax-color CSS in y-code already covers it.

const JS_KEYWORDS = new Set([
    "as",
    "async",
    "await",
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "export",
    "extends",
    "finally",
    "for",
    "from",
    "function",
    "get",
    "if",
    "import",
    "in",
    "instanceof",
    "let",
    "new",
    "of",
    "return",
    "set",
    "static",
    "super",
    "switch",
    "this",
    "throw",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "yield",
]);

const ALIASES = {
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    json: "json",
    css: "css",
};

const LANGUAGES = {
    javascript: tokenizeJavascript,
    json: tokenizeJson,
    css: tokenizeCss,
};

export function isSupportedLanguage(language) {
    if (!language) return false;
    const key = ALIASES[language] || language;
    return Object.prototype.hasOwnProperty.call(LANGUAGES, key);
}

export function tokenize(language, source) {
    const key = ALIASES[language] || language;
    const fn = LANGUAGES[key];
    if (!fn) return null;
    return fn(source ?? "");
}

// ---------------------------------------------------------------------------
// JavaScript
// ---------------------------------------------------------------------------

function tokenizeJavascript(source) {
    const out = [];
    const len = source.length;
    let i = 0;
    // `lastMeaningful` is the type of the most-recent non-whitespace,
    // non-comment token. Used to disambiguate `/` (regex vs division).
    let lastMeaningful = null;

    while (i < len) {
        const c = source[i];
        const c2 = source[i + 1];

        // Whitespace (preserved as a typeless token so layout/newlines survive).
        if (isWhitespace(c)) {
            const start = i;
            while (i < len && isWhitespace(source[i])) i++;
            out.push({ type: null, text: source.slice(start, i) });
            continue;
        }

        // Line comment.
        if (c === "/" && c2 === "/") {
            const start = i;
            while (i < len && source[i] !== "\n") i++;
            out.push({ type: "comment", text: source.slice(start, i) });
            continue;
        }

        // Block comment.
        if (c === "/" && c2 === "*") {
            const start = i;
            i += 2;
            while (i < len - 1 && !(source[i] === "*" && source[i + 1] === "/")) {
                i++;
            }
            i = Math.min(i + 2, len);
            out.push({ type: "comment", text: source.slice(start, i) });
            continue;
        }

        // String literals.
        if (c === "'" || c === '"') {
            i = consumeString(source, i, c, out);
            lastMeaningful = "string";
            continue;
        }

        // Template literals — treat as one `string` chunk including any
        // `${…}` expressions. A v3 follow-up could re-enter JS within the
        // expression slots.
        if (c === "`") {
            i = consumeTemplate(source, i, out);
            lastMeaningful = "string";
            continue;
        }

        // Regex literal vs division operator.
        if (c === "/" && canBeRegex(lastMeaningful)) {
            const next = tryConsumeRegex(source, i);
            if (next !== -1) {
                out.push({ type: "regex", text: source.slice(i, next) });
                i = next;
                lastMeaningful = "regex";
                continue;
            }
        }

        // Numbers.
        if (isDigit(c) || (c === "." && isDigit(c2))) {
            const start = i;
            i = consumeNumber(source, i);
            out.push({ type: "number", text: source.slice(start, i) });
            lastMeaningful = "number";
            continue;
        }

        // Identifiers / keywords / class names / function calls.
        if (isIdentStart(c)) {
            const start = i;
            while (i < len && isIdentPart(source[i])) i++;
            const word = source.slice(start, i);

            let type;
            if (JS_KEYWORDS.has(word)) type = "keyword";
            else if (word === "true" || word === "false") type = "boolean";
            else if (
                word === "null" ||
                word === "undefined" ||
                word === "NaN" ||
                word === "Infinity"
            ) {
                type = "constant";
            } else if (/^[A-Z]/.test(word)) {
                type = "class-name";
            } else {
                let j = i;
                while (j < len && isWhitespace(source[j])) j++;
                type = source[j] === "(" ? "function" : null;
            }

            out.push({ type, text: word });
            lastMeaningful = type || "identifier";
            continue;
        }

        // Punctuation.
        if ("{}[]();,:.".includes(c)) {
            out.push({ type: "punctuation", text: c });
            i++;
            lastMeaningful = "punctuation";
            continue;
        }

        // Operators (single-char is enough for highlighting; we don't need
        // to merge `===` / `=>` etc. into one token to color them correctly).
        if ("=+-*/%<>!&|^~?".includes(c)) {
            out.push({ type: "operator", text: c });
            i++;
            lastMeaningful = "operator";
            continue;
        }

        // Anything else (unrecognized) — pass through untyped.
        out.push({ type: null, text: c });
        i++;
    }

    return out;
}

// ---------------------------------------------------------------------------
// JSON
// ---------------------------------------------------------------------------

function tokenizeJson(source) {
    const out = [];
    const len = source.length;
    let i = 0;

    while (i < len) {
        const c = source[i];

        if (isWhitespace(c)) {
            const start = i;
            while (i < len && isWhitespace(source[i])) i++;
            out.push({ type: null, text: source.slice(start, i) });
            continue;
        }

        if (c === '"') {
            const start = i;
            i = consumeJsonString(source, i);
            // Property names are followed by `:` (possibly with whitespace).
            let j = i;
            while (j < len && isWhitespace(source[j])) j++;
            const type = source[j] === ":" ? "property" : "string";
            out.push({ type, text: source.slice(start, i) });
            continue;
        }

        if (c === "-" || isDigit(c)) {
            const start = i;
            i = consumeJsonNumber(source, i);
            out.push({ type: "number", text: source.slice(start, i) });
            continue;
        }

        if (source.startsWith("true", i)) {
            out.push({ type: "boolean", text: "true" });
            i += 4;
            continue;
        }
        if (source.startsWith("false", i)) {
            out.push({ type: "boolean", text: "false" });
            i += 5;
            continue;
        }
        if (source.startsWith("null", i)) {
            out.push({ type: "constant", text: "null" });
            i += 4;
            continue;
        }

        if ("{}[]:,".includes(c)) {
            out.push({ type: "punctuation", text: c });
            i++;
            continue;
        }

        // Fallback (malformed JSON, partial input, etc.).
        out.push({ type: null, text: c });
        i++;
    }

    return out;
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

function tokenizeCss(source) {
    const out = [];
    const len = source.length;
    let i = 0;
    // `state` tracks where we are in a CSS rule. Selectors run until `{`,
    // then declarations until `:`, then values until `;` or `}`.
    let state = "selector";

    while (i < len) {
        const c = source[i];
        const c2 = source[i + 1];

        if (isWhitespace(c)) {
            const start = i;
            while (i < len && isWhitespace(source[i])) i++;
            out.push({ type: null, text: source.slice(start, i) });
            continue;
        }

        // Block comments.
        if (c === "/" && c2 === "*") {
            const start = i;
            i += 2;
            while (i < len - 1 && !(source[i] === "*" && source[i + 1] === "/")) {
                i++;
            }
            i = Math.min(i + 2, len);
            out.push({ type: "comment", text: source.slice(start, i) });
            continue;
        }

        if (c === '"' || c === "'") {
            const start = i;
            const quote = c;
            i++;
            while (i < len && source[i] !== quote && source[i] !== "\n") {
                if (source[i] === "\\") i++;
                i++;
            }
            if (source[i] === quote) i++;
            out.push({ type: "string", text: source.slice(start, i) });
            continue;
        }

        if (c === "{") {
            out.push({ type: "punctuation", text: "{" });
            i++;
            state = "declaration";
            continue;
        }
        if (c === "}") {
            out.push({ type: "punctuation", text: "}" });
            i++;
            state = "selector";
            continue;
        }
        if (c === ":" && state === "declaration") {
            out.push({ type: "punctuation", text: ":" });
            i++;
            state = "value";
            continue;
        }
        if (c === ";") {
            out.push({ type: "punctuation", text: ";" });
            i++;
            if (state === "value") state = "declaration";
            continue;
        }

        if (c === "!" && source.startsWith("!important", i)) {
            out.push({ type: "important", text: "!important" });
            i += 10;
            continue;
        }

        // Numbers (with optional unit). CSS allows leading `-` and a bare
        // leading `.` only when immediately followed by a digit (so `.5em`
        // tokenizes as a number but `.btn` still becomes a selector).
        if (
            isDigit(c) ||
            (c === "." && isDigit(c2)) ||
            (c === "-" &&
                (isDigit(c2) ||
                    (c2 === "." && isDigit(source[i + 2]))))
        ) {
            const start = i;
            if (source[i] === "-") i++;
            while (i < len && (isDigit(source[i]) || source[i] === ".")) i++;
            while (i < len && /[a-zA-Z%]/.test(source[i])) i++;
            out.push({ type: "number", text: source.slice(start, i) });
            continue;
        }

        // `#hex` in value context; `#id` in selector context.
        if (c === "#") {
            const start = i;
            i++;
            while (i < len && /[a-zA-Z0-9_-]/.test(source[i])) i++;
            const type = state === "value" ? "number" : "selector";
            out.push({ type, text: source.slice(start, i) });
            continue;
        }

        // At-rules.
        if (c === "@") {
            const start = i;
            i++;
            while (i < len && /[a-zA-Z-]/.test(source[i])) i++;
            out.push({ type: "keyword", text: source.slice(start, i) });
            continue;
        }

        // CSS custom-property name (`--foo`) — most commonly appears as a
        // declaration. Tag as `property` either way.
        if (c === "-" && c2 === "-") {
            const start = i;
            i += 2;
            while (i < len && /[a-zA-Z0-9_-]/.test(source[i])) i++;
            out.push({ type: "property", text: source.slice(start, i) });
            continue;
        }

        if (/[a-zA-Z_]/.test(c)) {
            const start = i;
            while (i < len && /[a-zA-Z0-9_-]/.test(source[i])) i++;
            const word = source.slice(start, i);
            let type;
            if (state === "declaration") type = "property";
            else if (state === "selector") type = "selector";
            else {
                let j = i;
                while (j < len && isWhitespace(source[j])) j++;
                type = source[j] === "(" ? "function" : "attr-value";
            }
            out.push({ type, text: word });
            continue;
        }

        if ("(),>+~*=[]".includes(c)) {
            out.push({ type: "punctuation", text: c });
            i++;
            continue;
        }

        out.push({ type: null, text: c });
        i++;
    }

    return out;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isWhitespace(c) {
    return c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f";
}

function isDigit(c) {
    return c >= "0" && c <= "9";
}

function isIdentStart(c) {
    return /[a-zA-Z_$]/.test(c);
}

function isIdentPart(c) {
    return /[a-zA-Z0-9_$]/.test(c);
}

function canBeRegex(lastMeaningful) {
    // `/` is a regex literal after operators, punctuation, keywords, or at
    // the very start of input. After identifiers / numbers / strings /
    // closing-paren-or-bracket, it's division.
    if (lastMeaningful === null) return true;
    return (
        lastMeaningful === "operator" ||
        lastMeaningful === "keyword" ||
        lastMeaningful === "punctuation"
    );
}

function consumeString(source, start, quote, out) {
    const len = source.length;
    let i = start + 1;
    while (i < len) {
        const ch = source[i];
        if (ch === "\\") {
            i += 2;
            continue;
        }
        if (ch === quote || ch === "\n") break;
        i++;
    }
    if (source[i] === quote) i++;
    out.push({ type: "string", text: source.slice(start, i) });
    return i;
}

function consumeTemplate(source, start, out) {
    const len = source.length;
    let i = start + 1;
    while (i < len) {
        const ch = source[i];
        if (ch === "\\") {
            i += 2;
            continue;
        }
        if (ch === "`") {
            i++;
            break;
        }
        if (ch === "$" && source[i + 1] === "{") {
            // Skip past the matching `}`; track brace depth so nested
            // braces inside the expression don't terminate it early.
            i += 2;
            let depth = 1;
            while (i < len && depth > 0) {
                const k = source[i];
                if (k === "{") depth++;
                else if (k === "}") depth--;
                if (depth > 0) i++;
            }
            if (i < len) i++;
            continue;
        }
        i++;
    }
    out.push({ type: "string", text: source.slice(start, i) });
    return i;
}

function tryConsumeRegex(source, start) {
    const len = source.length;
    let i = start + 1;
    let inClass = false;
    while (i < len) {
        const ch = source[i];
        if (ch === "\\") {
            i += 2;
            continue;
        }
        if (ch === "[") inClass = true;
        else if (ch === "]") inClass = false;
        else if (ch === "/" && !inClass) {
            i++;
            while (i < len && /[gimsuy]/.test(source[i])) i++;
            return i;
        } else if (ch === "\n") {
            return -1;
        }
        i++;
    }
    return -1;
}

function consumeNumber(source, start) {
    const len = source.length;
    let i = start;
    if (
        source[i] === "0" &&
        i + 1 < len &&
        /[xXbBoO]/.test(source[i + 1])
    ) {
        i += 2;
        while (i < len && /[0-9a-fA-F_]/.test(source[i])) i++;
    } else {
        while (i < len && /[0-9_]/.test(source[i])) i++;
        if (source[i] === ".") {
            i++;
            while (i < len && /[0-9_]/.test(source[i])) i++;
        }
        if (i < len && /[eE]/.test(source[i])) {
            i++;
            if (/[+-]/.test(source[i])) i++;
            while (i < len && /[0-9_]/.test(source[i])) i++;
        }
    }
    if (source[i] === "n") i++;
    return i;
}

function consumeJsonString(source, start) {
    const len = source.length;
    let i = start + 1;
    while (i < len) {
        const ch = source[i];
        if (ch === "\\") {
            i += 2;
            continue;
        }
        if (ch === '"') {
            i++;
            break;
        }
        i++;
    }
    return i;
}

function consumeJsonNumber(source, start) {
    const len = source.length;
    let i = start;
    if (source[i] === "-") i++;
    while (i < len && isDigit(source[i])) i++;
    if (source[i] === ".") {
        i++;
        while (i < len && isDigit(source[i])) i++;
    }
    if (i < len && /[eE]/.test(source[i])) {
        i++;
        if (/[+-]/.test(source[i])) i++;
        while (i < len && isDigit(source[i])) i++;
    }
    return i;
}
