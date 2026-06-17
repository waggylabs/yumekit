import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";

// Cross-checks the AI/consumer-facing API docs against each component's
// `observedAttributes` — the source of truth for reflected attributes — and
// reports drift:
//   • react.d.ts (src/react.d.ts): observed attrs missing from the JSX types,
//     and typed keys that aren't observed attributes (stale / property-only).
//   • llm.txt: observed attrs not mentioned in the component's `### y-foo`
//     section.
// These are coverage signals, not generators: attribute *types* and prose
// descriptions are hand-authored and can't be derived from the source.
//
//   node scripts/check-docs.js           report
//   node scripts/check-docs.js --check    exit 1 if any observed attr is undocumented

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

const isGlobalAttr = (a) =>
    GLOBAL_ATTRS.has(a) || a.startsWith("aria-") || a.startsWith("data-");

// Verified real attributes a component reads (form association, or via
// hasAttribute/getAttribute at render/interaction time) without listing in
// observedAttributes — so declaring them in react.d.ts is correct, not stale.
// Keeping this explicit means a genuinely stale type still surfaces.
const INTENTIONAL_EXTRAS = {
    "y-rating": ["required"],
    "y-select": ["multiple"],
    "y-switch": ["name"],
    "y-theme": ["no-default-font"],
    "y-tree-item": ["history"],
};

const registered = collectRegistered("src/components");
let failures = 0;

failures += checkReactTypes();
for (const doc of MARKDOWN_DOCS) failures += checkMarkdownDoc(doc);

console.log(`\n${registered.size} registered elements checked.`);
if (CHECK && failures) {
    console.error(`\n✗ ${failures} doc coverage issue(s). See above.`);
    process.exit(1);
}

// --- react.d.ts ----------------------------------------------------------

function checkReactTypes() {
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

// --- markdown docs (llm.txt, reference.md) -------------------------------

function checkMarkdownDoc({ path, heading }) {
    const hashes = "#".repeat(heading);
    if (!existsSync(path)) {
        console.log(`\n· ${path} not found — skipped.`);
        return 0;
    }
    const text = readFileSync(path, "utf8");
    const sections = mdSections(text, heading);
    const report = [];
    let missing = 0;

    for (const [tag, observed] of [...registered].sort()) {
        const sec = sections[tag];
        if (!sec) {
            report.push(`✗ ${tag}: no "${hashes} ${tag}" section`);
            missing += 1;
            continue;
        }
        const undoc = [...observed].filter(
            (a) => !isGlobalAttr(a) && !mentions(sec, a),
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

function mdSections(text, level) {
    // Match headings at the given level that start with a y-* tag; a single
    // heading may cover several elements (e.g. "## y-panelbar + y-panel").
    const re = new RegExp(`^#{${level}} (y-[a-z-].*)$`, "gm");
    const out = {};
    const marks = [];
    let m;
    while ((m = re.exec(text))) {
        const tags = m[1].match(/y-[a-z-]+/g) || [];
        marks.push([tags, m.index]);
    }
    for (let i = 0; i < marks.length; i++) {
        const end = i + 1 < marks.length ? marks[i + 1][1] : text.length;
        const body = text.slice(marks[i][1], end);
        for (const tag of marks[i][0]) out[tag] = body;
    }
    return out;
}

// --- shared --------------------------------------------------------------

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

// Top-level attribute keys declared for `"<tag>": El<{ ... }>` in react.d.ts.
function reactAttrsFor(dts, tag) {
    const key = `"${tag}":`;
    const start = dts.indexOf(key);
    if (start === -1) return null;

    const decl = dts.slice(start + key.length).match(/^\s*El\s*(<|;)/);
    if (!decl) return null;
    if (decl[1] === ";") return new Set(); // bare El — container, no attrs

    let i = dts.indexOf("{", start);
    if (i === -1) return null;
    let depth = 0;
    let body = "";
    for (; i < dts.length; i++) {
        const ch = dts[i];
        if (ch === "{") depth += 1;
        if (depth >= 1) body += ch;
        if (ch === "}") {
            depth -= 1;
            if (depth === 0) break;
        }
    }

    // Flatten nested object literals and generics so only top-level keys remain.
    let flat = body.slice(1, -1);
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
    for (const seg of flat.split(/[;\n]/)) {
        const km = seg.match(/^\s*(?:"([^"]+)"|([A-Za-z_][\w-]*))\??\s*:/);
        if (km) keys.add(km[1] || km[2]);
    }
    return keys;
}

function walk(dir, onFile) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full, onFile);
        else onFile(full);
    }
}
