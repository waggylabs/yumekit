// Keeps the mechanically-derivable numbers in the AI docs (llm.txt + the
// Claude skill) in sync with the source of truth: package version, the count of
// registered `y-*` custom elements, and the number of built-in themes. The
// surrounding prose (per-component APIs, the theme breakdown) is hand-authored
// and is NOT touched here — update that by hand when components change.
//
// Modes:
//   node scripts/sync-llm-docs.js          rewrite the docs in place
//   node scripts/sync-llm-docs.js --check  report drift, exit 1 if any (CI)

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CHECK = process.argv.includes("--check");

// Nested-only sub-elements: registered custom elements that only exist as
// children of another component (documented under their parent, never used
// standalone). They are excluded from the headline component count.
const SUBELEMENTS = new Set(["y-panel", "y-tree-item"]);

// ---------- Source-of-truth numbers ----------

function readSources() {
    const version = JSON.parse(readFileSync("package.json", "utf8")).version;
    const componentCount = countCustomElements("src/components");
    const themeCount = readdirSync("tokens/themes").filter((f) =>
        f.endsWith(".json"),
    ).length;
    return { version, componentCount, themeCount };
}

// Recursively count unique `customElements.define("y-...")` registrations,
// excluding nested-only sub-elements (see SUBELEMENTS).
function countCustomElements(dir) {
    const names = new Set();
    const re = /customElements\.define\(\s*["'](y-[a-z-]+)["']/g;
    walk(dir, (file) => {
        if (!file.endsWith(".js") || file.endsWith(".test.js")) return;
        const src = readFileSync(file, "utf8");
        let m;
        while ((m = re.exec(src))) names.add(m[1]);
    });
    for (const sub of SUBELEMENTS) names.delete(sub);
    return names.size;
}

function walk(dir, onFile) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full, onFile);
        else onFile(full);
    }
}

// ---------- Substitution targets ----------

// Each target: a file, and the substitutions to apply. `find` must match
// exactly once — if it doesn't, the prose was restructured and we surface it
// rather than silently doing nothing.
function buildTargets({ version, componentCount, themeCount }) {
    return [
        {
            file: "llm.txt",
            subs: [
                {
                    find: /(## Version\r?\n)[^\r\n]+/,
                    replace: `$1${version}`,
                    label: "version",
                },
                {
                    find: /(providing )\d+( production-ready custom HTML elements)/,
                    replace: `$1${componentCount}$2`,
                    label: "component count",
                },
                {
                    find: /(- )\d+( built-in themes)/,
                    replace: `$1${themeCount}$2`,
                    label: "theme count",
                },
                {
                    find: /(\()\d+( themes total\))/,
                    replace: `$1${themeCount}$2`,
                    label: "theme count (total)",
                },
            ],
        },
        {
            file: ".claude/skills/yumekit/SKILL.md",
            subs: [
                {
                    find: /(with )\d+( custom `y-\*` elements)/,
                    replace: `$1${componentCount}$2`,
                    label: "component count",
                },
            ],
        },
    ];
}

// ---------- Drift planning ----------

// Validate every anchor and compute the new text without writing. A missing
// anchor means the prose was restructured; the caller bails before any write.
function planEdits(targets) {
    const missing = [];
    const stale = [];
    const pending = [];

    for (const { file, subs } of targets) {
        const original = readFileSync(file, "utf8");
        let text = original;

        for (const { find, replace, label } of subs) {
            if (!find.test(text)) {
                missing.push(`${file}: could not find anchor for "${label}"`);
                continue;
            }
            const next = text.replace(find, replace);
            if (next !== text) {
                stale.push(`${file}: ${label}`);
                text = next;
            }
        }

        if (text !== original) pending.push({ file, text });
    }

    return { missing, stale, pending };
}

// ---------- Run ----------

function main() {
    const sources = readSources();
    const { missing, stale, pending } = planEdits(buildTargets(sources));

    if (missing.length) {
        console.error("\n✗ Anchor(s) not found — the docs may have been restructured:");
        missing.forEach((m) => console.error(`  ${m}`));
        process.exit(1);
    }

    if (!CHECK) {
        pending.forEach(({ file, text }) => writeFileSync(file, text));
    }
    stale.forEach((s) => console.log(`  ${CHECK ? "✗" : "~"} ${s}`));

    const { version, componentCount, themeCount } = sources;
    console.log(
        `\nSources: v${version}, ${componentCount} components, ${themeCount} themes`,
    );

    if (CHECK) {
        if (stale.length) {
            console.error(
                `\n✗ AI docs are out of sync (${stale.length}). Run \`npm run sync:docs\`.`,
            );
            process.exit(1);
        }
        console.log("✔ AI docs are in sync.");
        return;
    }

    console.log(
        stale.length
            ? `✔ Synced AI docs (${stale.length} updated).`
            : "✔ AI docs already in sync.",
    );
}

main();
