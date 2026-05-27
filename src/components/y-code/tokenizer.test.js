import { expect } from "@open-wc/testing";
import { isSupportedLanguage, tokenize } from "./tokenizer.js";

// Helper: collapse a token stream into `[type, text]` tuples, dropping
// whitespace-only tokens for terser assertions.
function typed(tokens) {
    return tokens
        .filter((t) => t.type !== null)
        .map((t) => [t.type, t.text]);
}

describe("tokenizer", () => {
    describe("isSupportedLanguage", () => {
        it("returns true for all phase 2 + 3 languages", () => {
            expect(isSupportedLanguage("javascript")).to.be.true;
            expect(isSupportedLanguage("typescript")).to.be.true;
            expect(isSupportedLanguage("json")).to.be.true;
            expect(isSupportedLanguage("css")).to.be.true;
            expect(isSupportedLanguage("python")).to.be.true;
            expect(isSupportedLanguage("bash")).to.be.true;
            expect(isSupportedLanguage("html")).to.be.true;
        });

        it("supports common aliases", () => {
            expect(isSupportedLanguage("js")).to.be.true;
            expect(isSupportedLanguage("ts")).to.be.true;
            expect(isSupportedLanguage("tsx")).to.be.true;
            expect(isSupportedLanguage("py")).to.be.true;
            expect(isSupportedLanguage("sh")).to.be.true;
            expect(isSupportedLanguage("zsh")).to.be.true;
            expect(isSupportedLanguage("xml")).to.be.true;
            expect(isSupportedLanguage("svg")).to.be.true;
        });

        it("returns false for unknown languages and falsy input", () => {
            expect(isSupportedLanguage("ruby")).to.be.false;
            expect(isSupportedLanguage("text")).to.be.false;
            expect(isSupportedLanguage("")).to.be.false;
            expect(isSupportedLanguage(null)).to.be.false;
            expect(isSupportedLanguage(undefined)).to.be.false;
        });
    });

    describe("tokenize() returns null for unsupported languages", () => {
        it("returns null for ruby / text / unknown", () => {
            expect(tokenize("ruby", "puts 1")).to.equal(null);
            expect(tokenize("text", "hi")).to.equal(null);
            expect(tokenize("does-not-exist", "x")).to.equal(null);
        });
    });

    // ── JavaScript ─────────────────────────────────────────────────────

    describe("javascript", () => {
        it("classifies keywords", () => {
            const t = typed(tokenize("javascript", "const x = 1;"));
            expect(t).to.deep.include(["keyword", "const"]);
        });

        it("treats class-cased identifiers as class-name", () => {
            const t = typed(tokenize("javascript", "const c = new MyClass();"));
            expect(t).to.deep.include(["class-name", "MyClass"]);
        });

        it("treats `true` / `false` as boolean and `null` as constant", () => {
            const t = typed(tokenize("javascript", "let a = true; let b = null;"));
            expect(t).to.deep.include(["boolean", "true"]);
            expect(t).to.deep.include(["constant", "null"]);
        });

        it("classifies an identifier followed by `(` as function", () => {
            const t = typed(tokenize("javascript", "compute(1, 2)"));
            expect(t).to.deep.include(["function", "compute"]);
        });

        it("classifies numbers (decimal, hex, BigInt)", () => {
            const t = typed(tokenize("javascript", "1 0xff 99n"));
            expect(t).to.deep.include(["number", "1"]);
            expect(t).to.deep.include(["number", "0xff"]);
            expect(t).to.deep.include(["number", "99n"]);
        });

        it("captures double-quoted and single-quoted strings", () => {
            const t = typed(tokenize("javascript", `"hi"; 'yo'`));
            expect(t).to.deep.include(["string", '"hi"']);
            expect(t).to.deep.include(["string", "'yo'"]);
        });

        it("captures template literals including ${...} expressions", () => {
            const tokens = tokenize("javascript", "`hello, ${name}!`");
            const strs = tokens.filter((t) => t.type === "string");
            expect(strs.length).to.equal(1);
            expect(strs[0].text).to.equal("`hello, ${name}!`");
        });

        it("captures line and block comments", () => {
            const a = typed(tokenize("javascript", "// line\nconst x"));
            expect(a).to.deep.include(["comment", "// line"]);
            const b = typed(tokenize("javascript", "/* block */\nconst x"));
            expect(b).to.deep.include(["comment", "/* block */"]);
        });

        it("recognizes a regex literal after an operator (not as division)", () => {
            const t = tokenize("javascript", "const r = /ab+c/gi;");
            const regex = t.find((tok) => tok.type === "regex");
            expect(regex).to.exist;
            expect(regex.text).to.equal("/ab+c/gi");
        });

        it("treats `/` as division after an identifier", () => {
            const t = tokenize("javascript", "a / b");
            expect(t.find((tok) => tok.type === "regex")).to.be.undefined;
            expect(t.find((tok) => tok.type === "operator" && tok.text === "/"))
                .to.exist;
        });

        it("preserves the original source when tokens are concatenated", () => {
            const src = `function add(a, b) {
    // sum
    return a + b;
}`;
            const t = tokenize("javascript", src);
            const reconstructed = t.map((tok) => tok.text).join("");
            expect(reconstructed).to.equal(src);
        });
    });

    // ── JSON ───────────────────────────────────────────────────────────

    describe("json", () => {
        it("tags property names vs string values", () => {
            const t = tokenize("json", '{ "name": "alice" }');
            const props = t.filter((tok) => tok.type === "property");
            const strs = t.filter((tok) => tok.type === "string");
            expect(props.length).to.equal(1);
            expect(props[0].text).to.equal('"name"');
            expect(strs.length).to.equal(1);
            expect(strs[0].text).to.equal('"alice"');
        });

        it("classifies numbers, booleans, and null", () => {
            const t = typed(tokenize("json", '{ "a": 1, "b": true, "c": null }'));
            expect(t).to.deep.include(["number", "1"]);
            expect(t).to.deep.include(["boolean", "true"]);
            expect(t).to.deep.include(["constant", "null"]);
        });

        it("handles arrays and nested objects", () => {
            const t = typed(tokenize("json", '{"items":[1,2,3]}'));
            expect(t).to.deep.include(["punctuation", "{"]);
            expect(t).to.deep.include(["punctuation", "["]);
            expect(t).to.deep.include(["number", "2"]);
        });

        it("preserves the original source when tokens are concatenated", () => {
            const src = '{\n  "name": "yk",\n  "ok": true\n}';
            const t = tokenize("json", src);
            expect(t.map((tok) => tok.text).join("")).to.equal(src);
        });
    });

    // ── CSS ────────────────────────────────────────────────────────────

    describe("css", () => {
        it("classifies selectors, properties, and values", () => {
            const t = typed(tokenize("css", ".btn { color: red; }"));
            expect(t.some(([k, v]) => k === "selector" && v === "btn"))
                .to.be.true;
            expect(t).to.deep.include(["property", "color"]);
            expect(t).to.deep.include(["attr-value", "red"]);
        });

        it("captures comments and strings", () => {
            const t = tokenize(
                "css",
                `/* comment */ .x { content: "hello"; }`,
            );
            expect(t.find((tok) => tok.type === "comment").text).to.equal(
                "/* comment */",
            );
            expect(t.find((tok) => tok.type === "string").text).to.equal(
                '"hello"',
            );
        });

        it("tags numeric values with units and hex colors", () => {
            const t = tokenize("css", ".x { width: 12px; color: #fff; }");
            expect(t.find((tok) => tok.text === "12px").type).to.equal("number");
            expect(t.find((tok) => tok.text === "#fff").type).to.equal("number");
        });

        it("tags @-rules as keywords", () => {
            const t = typed(tokenize("css", "@media (min-width: 600px) {}"));
            expect(t).to.deep.include(["keyword", "@media"]);
        });

        it("tags !important", () => {
            const t = typed(tokenize("css", ".x { color: red !important; }"));
            expect(t).to.deep.include(["important", "!important"]);
        });

        it("tags CSS custom-property names as properties", () => {
            const t = typed(
                tokenize("css", ".x { --my-token: 1rem; color: var(--my-token); }"),
            );
            expect(t).to.deep.include(["property", "--my-token"]);
        });

        it("classifies value-context function names as functions", () => {
            const t = typed(tokenize("css", ".x { color: rgb(255, 0, 0); }"));
            expect(t).to.deep.include(["function", "rgb"]);
        });

        it("preserves the original source when tokens are concatenated", () => {
            const src = `.box {
    padding: 8px;
    color: #333;
}`;
            const t = tokenize("css", src);
            expect(t.map((tok) => tok.text).join("")).to.equal(src);
        });
    });

    // ── TypeScript ────────────────────────────────────────────────────

    describe("typescript", () => {
        it("recognizes TS-specific keywords", () => {
            const t = typed(
                tokenize("typescript", "interface User { name: string }"),
            );
            expect(t).to.deep.include(["keyword", "interface"]);
            expect(t).to.deep.include(["keyword", "string"]);
        });

        it("still classifies JS keywords like const", () => {
            const t = typed(tokenize("typescript", "const x: number = 1;"));
            expect(t).to.deep.include(["keyword", "const"]);
            expect(t).to.deep.include(["keyword", "number"]);
        });

        it("recognizes `type`, `enum`, `declare`, `readonly`", () => {
            const t = typed(
                tokenize(
                    "typescript",
                    "declare type X = enum readonly any",
                ),
            );
            expect(t).to.deep.include(["keyword", "declare"]);
            expect(t).to.deep.include(["keyword", "type"]);
            expect(t).to.deep.include(["keyword", "enum"]);
            expect(t).to.deep.include(["keyword", "readonly"]);
            expect(t).to.deep.include(["keyword", "any"]);
        });
    });

    // ── Python ────────────────────────────────────────────────────────

    describe("python", () => {
        it("classifies def/class/return as keywords", () => {
            const t = typed(
                tokenize("python", "def add(a, b):\n    return a + b"),
            );
            expect(t).to.deep.include(["keyword", "def"]);
            expect(t).to.deep.include(["keyword", "return"]);
        });

        it("tags True/False as boolean and None as constant", () => {
            const t = typed(tokenize("python", "x = True; y = None"));
            expect(t).to.deep.include(["boolean", "True"]);
            expect(t).to.deep.include(["constant", "None"]);
        });

        it("captures single-, double-, and triple-quoted strings", () => {
            const t = tokenize("python", `'one' "two" """three"""`);
            const strs = t.filter((tok) => tok.type === "string");
            expect(strs.map((s) => s.text)).to.deep.equal([
                "'one'",
                '"two"',
                '"""three"""',
            ]);
        });

        it("captures f-string, raw, and byte string prefixes as part of the string", () => {
            const t = tokenize("python", `f"hello" r"\\d+" b'bytes'`);
            const strs = t.filter((tok) => tok.type === "string");
            expect(strs.map((s) => s.text)).to.deep.equal([
                'f"hello"',
                'r"\\d+"',
                "b'bytes'",
            ]);
        });

        it("classifies @decorator as a function token", () => {
            const t = tokenize("python", "@dataclass\nclass X: pass");
            const deco = t.find((tok) => tok.text === "@dataclass");
            expect(deco?.type).to.equal("function");
        });

        it("tags Pascal-cased identifiers as class-name", () => {
            const t = typed(tokenize("python", "x = MyService()"));
            expect(t).to.deep.include(["class-name", "MyService"]);
        });

        it("classifies comments starting with #", () => {
            const t = tokenize("python", "# comment\nx = 1");
            expect(t.find((tok) => tok.type === "comment").text).to.equal(
                "# comment",
            );
        });

        it("preserves the original source when tokens are concatenated", () => {
            const src = `def add(a, b):
    # sum
    return a + b`;
            const t = tokenize("python", src);
            expect(t.map((tok) => tok.text).join("")).to.equal(src);
        });
    });

    // ── Bash ──────────────────────────────────────────────────────────

    describe("bash", () => {
        it("tags keywords (if / then / fi)", () => {
            const t = typed(
                tokenize("bash", "if [ -f file ]; then echo hi; fi"),
            );
            expect(t).to.deep.include(["keyword", "if"]);
            expect(t).to.deep.include(["keyword", "then"]);
            expect(t).to.deep.include(["keyword", "fi"]);
        });

        it("tags builtins like echo as function", () => {
            const t = typed(tokenize("bash", "echo hello"));
            expect(t).to.deep.include(["function", "echo"]);
        });

        it("tags variable references ($VAR, ${VAR}, $1)", () => {
            const t = tokenize("bash", "echo $HOME ${USER} $1");
            const vars = t.filter((tok) => tok.type === "variable");
            expect(vars.map((v) => v.text)).to.deep.equal([
                "$HOME",
                "${USER}",
                "$1",
            ]);
        });

        it("treats double- and single-quoted strings as strings", () => {
            const t = tokenize("bash", `echo "hello $USER" 'literal $x'`);
            const strs = t.filter((tok) => tok.type === "string");
            expect(strs.length).to.equal(2);
            expect(strs[0].text).to.equal('"hello $USER"');
            expect(strs[1].text).to.equal("'literal $x'");
        });

        it("tags # comments", () => {
            const t = tokenize("bash", "# header\necho hi");
            expect(t.find((tok) => tok.type === "comment").text).to.equal(
                "# header",
            );
        });

        it("treats the first command of each line as a function", () => {
            const t = typed(tokenize("bash", "mycmd arg1\nothercmd arg2"));
            expect(t.find(([k, v]) => k === "function" && v === "mycmd"))
                .to.exist;
            expect(t.find(([k, v]) => k === "function" && v === "othercmd"))
                .to.exist;
        });

        it("tags FOO=value as variable assignment, not a command", () => {
            const t = typed(tokenize("bash", "FOO=bar echo $FOO"));
            expect(t.find(([k, v]) => k === "variable" && v === "FOO")).to.exist;
        });

        it("preserves the original source when tokens are concatenated", () => {
            const src = `#!/usr/bin/env bash
if [ -z "$1" ]; then
    echo "missing arg"
    exit 1
fi`;
            const t = tokenize("bash", src);
            expect(t.map((tok) => tok.text).join("")).to.equal(src);
        });
    });

    // ── HTML ──────────────────────────────────────────────────────────

    describe("html", () => {
        it("tags tag names, attribute names, and attribute values", () => {
            const t = tokenize(
                "html",
                `<a href="/x" class="btn">click</a>`,
            );
            expect(t.find((tok) => tok.type === "tag" && tok.text === "a"))
                .to.exist;
            expect(
                t.find(
                    (tok) =>
                        tok.type === "attr-name" && tok.text === "href",
                ),
            ).to.exist;
            expect(
                t.find(
                    (tok) =>
                        tok.type === "attr-value" && tok.text === '"/x"',
                ),
            ).to.exist;
        });

        it("captures comments", () => {
            const t = tokenize("html", "<!-- hi --><p>x</p>");
            expect(t.find((tok) => tok.type === "comment").text).to.equal(
                "<!-- hi -->",
            );
        });

        it("captures doctype as a keyword", () => {
            const t = tokenize("html", "<!DOCTYPE html><html></html>");
            expect(t.find((tok) => tok.type === "keyword").text).to.equal(
                "<!DOCTYPE html>",
            );
        });

        it("captures HTML entities as constants", () => {
            const t = tokenize("html", "&lt;div&gt;");
            const entities = t.filter((tok) => tok.type === "constant");
            expect(entities.map((e) => e.text)).to.deep.equal(["&lt;", "&gt;"]);
        });

        it("handles a self-closing tag", () => {
            const t = tokenize("html", '<img src="logo.png" />');
            expect(t.find((tok) => tok.type === "tag").text).to.equal("img");
            // The trailing `/` is captured as punctuation.
            const slashes = t.filter(
                (tok) => tok.type === "punctuation" && tok.text === "/",
            );
            expect(slashes.length).to.equal(1);
        });

        it("preserves the original source when tokens are concatenated", () => {
            const src = `<!DOCTYPE html>
<html lang="en">
    <head><title>x</title></head>
    <body>
        <!-- main -->
        <p class="lead">Hello, &lt;world&gt;</p>
    </body>
</html>`;
            const t = tokenize("html", src);
            expect(t.map((tok) => tok.text).join("")).to.equal(src);
        });
    });
});
