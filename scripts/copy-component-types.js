// Flattens each component's generated type declaration up one level, so the
// `./components/*` export paths in package.json resolve to types: copies
// `dist/components/<name>/<name>.d.ts` → `dist/components/<name>.d.ts`.
//
// Usage: `node scripts/copy-component-types.js` (runs as part of `npm run build`)

import { readdirSync, copyFileSync, existsSync } from "fs";
import { join } from "path";

const COMPONENTS_DIR = "dist/components";

// Copies one component's `<dir>/<name>/<name>.d.ts` up to `<dir>/<name>.d.ts`.
// No-ops when the component has no generated declaration.
function flattenComponentTypes(dir, name) {
    const src = join(dir, name, `${name}.d.ts`);
    if (!existsSync(src)) return;
    copyFileSync(src, join(dir, `${name}.d.ts`));
}

function main() {
    const entries = readdirSync(COMPONENTS_DIR, { withFileTypes: true });
    const components = entries.filter((entry) => entry.isDirectory());

    for (const component of components) {
        flattenComponentTypes(COMPONENTS_DIR, component.name);
    }
}

main();
