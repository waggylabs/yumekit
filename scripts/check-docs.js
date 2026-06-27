// Cross-checks the AI/consumer-facing API docs against each component's
// `observedAttributes` — the source of truth for reflected attributes — and
// reports drift:
//   • react.d.ts (src/react.d.ts): observed attrs missing from the JSX types,
//     and typed keys that aren't observed attributes (stale / property-only).
//   • llm.txt / reference.md: observed attrs not mentioned in the component's
//     `### y-foo` section.
// These are coverage signals, not generators: attribute *types* and prose
// descriptions are hand-authored and can't be derived from the source.
//
//   node scripts/check-docs.js           report
//   node scripts/check-docs.js --check   exit 1 if any observed attr is undocumented

import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const CHECK = process.argv.includes("--check");
const DTS = "src/react.d.ts";

// Hand-authored markdown API docs that list attributes per `<heading> y-foo`
// section. Each is coverage-checked against observedAttributes.
const MARKDOWN_DOCS = [
    { path: "llm.txt", heading: 3 },
    { path: ".claude/skills/yumekit/reference.md", heading: 2 },
];

// Standard global HTML / ARIA attributes the docs don't need to enumerate
// (the React `El<>` base type already provides them; prose treats them as
// universal). Never drift, in either direction.
const GLOBAL_ATTRS = new Set([
    "hidden", "id", "title", "role", "tabindex", "draggable", "lang", "dir",
    "class", "style", "slot", "children", "ref", "key",
]);

// Verified real attributes a component reads (form association, or via
// hasAttribute/getAttribute at render/interaction time) without listing in
// observedAttributes — so declaring them in react.d.ts is correct, not stale.
// Keeping this explicit means a genuinely stale type still surfaces.
const INTENTIONAL_EXTRAS = {
    "y-panelbar": ["exclusive"],
    "y-rating": ["required"],
    "y-select": ["multiple"],
    "y-switch": ["name"],
    "y-theme": ["no-default-font"],
    "y-tree-item": ["history"],
};

const isGlobalAttr = (a) =>
    GLOBAL_ATTRS.has(a) || a.startsWith("aria-") || a.startsWith("data-");

// ---------- react.d.ts coverage ----------

// Reports observed attributes missing from the JSX types, and typed keys that
// are neither observed nor an intentional extra. Returns the count of
// undocumented observed attributes (the --check failure signal).
function checkReactTypes(registered) {
    const dts = readFileSync(DTS, "utf8");
    const report = [];
    let missing = 0;

    for (const [tag, observed] of [...registered].sort()) {
        const typed = reactAttrsFor(dts, tag);
        if (typed === null) {
            report.push(`✗ ${tag}: no entry in react.d.ts`);
            missing += 1;
            continue;
        }

        const allowed = new Set(INTENTIONAL_EXTRAS[tag] || []);
        const undoc = [...observed].filter((a) => !typed.has(a) && !isGlobalAttr(a));
        const extra = [...typed].filter(
            (a) => !observed.has(a) && !isGlobalAttr(a) && !allowed.has(a),
        );

        if (undoc.length || extra.length) {
            const parts = [];
            if (undoc.length) parts.push(`missing in types: ${undoc.join(", ")}`);
            if (extra.length) parts.push(`not an observed attr: ${extra.join(", ")}`);
            report.push(`~ ${tag}: ${parts.join(" | ")}`);
            missing += undoc.length;
        }
    }

    console.log(report.length ? "react.d.ts drift:\n" : "✔ react.d.ts covers every observed attribute.");
    if (report.length) console.log(report.map((r) => `  ${r}`).join("\n"));
    return missing;
}

// Top-level attribute keys declared for `"<tag>": El<{ ... }>` in react.d.ts.
// Returns null when the tag has no entry, an empty Set for a bare `El`
// (attribute-less container), otherwise the set of declared key names.
function reactAttrsFor(dts, tag) {
    const key = `"${tag}":`;
    const start = dts.indexOf(key);
    if (start === -1) return null;

    const decl = dts.slice(start + key.length).match(/^\s*El\s*(<|;)/);
    if (!decl) return null;
    if (decl[1] === ";") return new Set(); // bare El — container, no attrs

    const body = braceBlockFrom(dts, start);
    if (body === null) return null;

    return topLevelKeys(body);
}

// Returns the brace-balanced block (including the outer braces) starting at the
// first `{` at or after `from`, or null if there is none.
function braceBlockFrom(text, from) {
    let i = text.indexOf("{", from);
    if (i === -1) return null;

    let depth = 0;
    let block = "";
    for (; i < text.length; i++) {
        const ch = text[i];
        if (ch === "{") depth += 1;
        if (depth >= 1) block += ch;
        if (ch === "}") {
            depth -= 1;
            if (depth === 0) break;
        }
    }
    return block;
}

// Extracts the top-level object keys from a `{ ... }` block by stripping nested
// object literals and generics until only the outermost keys remain.
function topLevelKeys(block) {
    let flat = block.slice(1, -1);

    let prev;
    do {
        prev = flat;
        flat = flat.replace(/\{[^{}]*\}/g, "");
    } while (flat !== prev);
    do {
        prev = flat;
        flat = flat.replace(/<[^<>]*>/g, "");
    } while (flat !== prev);

    const keys = new Set();
    for (const segment of flat.split(/[;\n]/)) {
        const keyMatch = segment.match(/^\s*(?:"([^"]+)"|([A-Za-z_][\w-]*))\??\s*:/);
        if (keyMatch) keys.add(keyMatch[1] || keyMatch[2]);
    }
    return keys;
}

// ---------- markdown coverage (llm.txt, reference.md) ----------

// Reports observed attributes that lack any mention in their component's
// markdown section. Returns the count of undocumented attributes.
function checkMarkdownDoc(registered, { path, heading }) {
    const hashes = "#".repeat(heading);
    if (!existsSync(path)) {
        console.log(`\n· ${path} not found — skipped.`);
        return 0;
    }

    const sections = mdSections(readFileSync(path, "utf8"), heading);
    const report = [];
    let missing = 0;

    for (const [tag, observed] of [...registered].sort()) {
        const section = sections[tag];
        if (!section) {
            report.push(`✗ ${tag}: no "${hashes} ${tag}" section`);
            missing += 1;
            continue;
        }
        const undoc = [...observed].filter(
            (a) => !isGlobalAttr(a) && !mentions(section, a),
        );
        if (undoc.length) {
            report.push(`~ ${tag}: undocumented: ${undoc.join(", ")}`);
            missing += undoc.length;
        }
    }

    console.log(
        report.length
            ? `\n${path} drift:\n`
            : `\n✔ ${path} documents every observed attribute.`,
    );
    if (report.length) console.log(report.map((r) => `  ${r}`).join("\n"));
    return missing;
}

// An attribute counts as documented if its name appears as a backticked token
// or a whole word in the section (the docs list them as `attr-name`).
function mentions(section, attr) {
    return (
        section.includes("`" + attr + "`") ||
        new RegExp(`\\b${attr.replace(/-/g, "\\-")}\\b`).test(section)
    );
}

// Maps each y-* tag to the markdown body of its heading. A single heading may
// cover several elements (e.g. "## y-panelbar + y-panel"); each gets the body.
function mdSections(text, level) {
    const re = new RegExp(`^#{${level}} (y-[a-z-].*)$`, "gm");
    const marks = [];
    let m;
    while ((m = re.exec(text))) {
        const tags = m[1].match(/y-[a-z-]+/g) || [];
        marks.push([tags, m.index]);
    }

    const out = {};
    for (let i = 0; i < marks.length; i++) {
        const end = i + 1 < marks.length ? marks[i + 1][1] : text.length;
        const body = text.slice(marks[i][1], end);
        for (const tag of marks[i][0]) out[tag] = body;
    }
    return out;
}

// ---------- component sources ----------

// Map of tag -> Set(observedAttributes) for every registered y-* element.
function collectRegistered(dir) {
    const map = new Map();
    walk(dir, (file) => {
        if (!file.endsWith(".js") || file.endsWith(".test.js")) return;
        const src = readFileSync(file, "utf8");
        for (const d of src.matchAll(/customElements\.define\(\s*["'](y-[a-z-]+)["']/g)) {
            map.set(d[1], observedAttrsFor(src));
        }
    });
    return map;
}

function observedAttrsFor(src) {
    const attrs = new Set();
    const m = src.match(
        /static\s+get\s+observedAttributes\s*\(\s*\)\s*\{[\s\S]*?return\s*(\[[\s\S]*?\])/,
    );
    if (m) for (const q of m[1].matchAll(/["']([^"']+)["']/g)) attrs.add(q[1]);
    return attrs;
}

function walk(dir, onFile) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full, onFile);
        else onFile(full);
    }
}

// ---------- run ----------

function main() {
    const registered = collectRegistered("src/components");

    let failures = checkReactTypes(registered);
    for (const doc of MARKDOWN_DOCS) failures += checkMarkdownDoc(registered, doc);

    console.log(`\n${registered.size} registered elements checked.`);

    if (CHECK && failures) {
        console.error(`\n✗ ${failures} doc coverage issue(s). See above.`);
        process.exit(1);
    }
}

main();
