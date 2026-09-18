// Verifies the built package's internal module graph: every relative import
// specifier emitted into a dist/ JS bundle must resolve to a file that exists
// in dist/. The per-component builds in rollup.config.js keep shared modules
// and sibling components external and remap the source-tree specifiers onto
// the flatter dist/ layout — a bad remap (or a module missing from the
// copy-assets step) publishes bundles that 404 at runtime, which the regular
// test suite never sees because it runs against src/.
//
//   node scripts/check-dist-imports.js   exit 1 on any unresolved specifier
//
// It also enforces a size ceiling on bundles that must stay small. Theme CSS
// lives in dist/themes/all.js, not in the y-theme component bundle — a stray
// styles/*.css import in a component would silently re-inline ~1 MB of CSS and
// undo that split.

import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { join, dirname, resolve } from "path";

const DIST = "dist";
const SCAN_DIRS = [".", "components", "modules", "icons", "themes"];

// Static import/export-from specifiers in the generated ESM output.
const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[^"'\n]*["']([^"']+)["']/g;

function collectBundles() {
    const bundles = [];

    for (const dir of SCAN_DIRS) {
        const full = join(DIST, dir);
        if (!existsSync(full)) continue;
        for (const file of readdirSync(full)) {
            const path = join(full, file);
            if (file.endsWith(".js") && statSync(path).isFile())
                bundles.push(path);
        }
    }

    return bundles;
}

if (!existsSync(DIST)) {
    console.error("✖ dist/ not found — run `npm run build` first.");
    process.exit(1);
}

let checked = 0;
const broken = [];

for (const bundle of collectBundles()) {
    const code = readFileSync(bundle, "utf8");

    for (const match of code.matchAll(IMPORT_RE)) {
        const spec = match[1];
        if (!spec.startsWith(".")) continue;

        checked++;
        const target = resolve(dirname(bundle), spec);
        if (!existsSync(target)) broken.push(`${bundle} → ${spec}`);
    }
}

if (broken.length) {
    console.error(`✖ ${broken.length} unresolved import specifier(s) in dist/:`);
    for (const b of broken) console.error(`    ${b}`);
    process.exit(1);
}

console.log(`✔ All ${checked} relative import specifiers in dist/ resolve.`);

// Bundles that must stay small, and why. Sizes in KB.
//
// y-theme's floor is the JSON-escaped copy of styles/variables.css it inlines
// (~58 KB at 44 KB of source CSS), so the limit only leaves headroom for that
// sheet to grow. Before the theme registry this bundle was ~980 KB: the limit
// exists to catch a styles/*.css import drifting back into a component.
const SIZE_LIMITS = {
    "components/y-theme.js": 75,
};

const oversized = [];

for (const [rel, limitKB] of Object.entries(SIZE_LIMITS)) {
    const path = join(DIST, rel);
    if (!existsSync(path)) {
        oversized.push(`${rel} — missing from dist/`);
        continue;
    }
    const sizeKB = statSync(path).size / 1024;
    if (sizeKB > limitKB) {
        oversized.push(
            `${rel} — ${sizeKB.toFixed(1)} KB exceeds the ${limitKB} KB limit`,
        );
    }
}

if (oversized.length) {
    console.error(`✖ ${oversized.length} dist/ bundle(s) over their size limit:`);
    for (const o of oversized) console.error(`    ${o}`);
    process.exit(1);
}

console.log(
    `✔ All ${Object.keys(SIZE_LIMITS).length} size-limited dist/ bundle(s) within budget.`,
);
