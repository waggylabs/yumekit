import { readdirSync, mkdirSync, copyFileSync, existsSync } from "fs";
import { join } from "path";
import terser from "@rollup/plugin-terser";

function cssString() {
    return {
        name: "css-string",
        transform(code, id) {
            if (id.endsWith(".css")) {
                return {
                    code: `export default ${JSON.stringify(code)};`,
                    map: { mappings: "" },
                };
            }
        },
    };
}

function svgString() {
    return {
        name: "svg-string",
        transform(code, id) {
            if (id.endsWith(".svg")) {
                return {
                    code: `export default ${JSON.stringify(code)};`,
                    map: { mappings: "" },
                };
            }
        },
    };
}

const componentDir = "src/components";
const componentNames = readdirSync(componentDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

// Individual component builds keep shared modules and sibling components
// external so each dist/components/*.js bundle contains only its own code.
// Everything else (CSS strings, inline SVG icon exports) stays inlined.
// Matching runs on the raw import specifiers (see
// `makeAbsoluteExternalsRelative: false` below), so the patterns mirror how
// the source files are written.
const crossComponentImport = /^\.\.\/(y-[\w-]+)\/\1\.js$/;

function componentExternal(id) {
    return (
        /^\.\.\/\.\.\/modules\/[\w.-]+\.js$/.test(id) ||
        id === "../../icons/registry.js" ||
        crossComponentImport.test(id)
    );
}

// Map source-tree specifiers onto the flatter dist/ layout:
//   ../../modules/helpers.js  → ../modules/helpers.js
//   ../../icons/registry.js   → ../icons/registry.js
//   ../y-icon/y-icon.js       → ./y-icon.js
function componentPaths(id) {
    const sibling = id.match(crossComponentImport);
    if (sibling) return `./${sibling[1]}.js`;
    return id.replace(/^\.\.\/\.\.\//, "../");
}

// Copy non-JS assets (styles/, modules/) into dist/
function copyAssets() {
    return {
        name: "copy-assets",
        writeBundle() {
            // styles/
            const stylesOut = "dist/styles";
            if (!existsSync(stylesOut))
                mkdirSync(stylesOut, { recursive: true });
            for (const f of readdirSync("styles")) {
                copyFileSync(join("styles", f), join(stylesOut, f));
            }
            // modules/ (tests stay out of the published package)
            const modulesOut = "dist/modules";
            if (!existsSync(modulesOut))
                mkdirSync(modulesOut, { recursive: true });
            for (const f of readdirSync("src/modules")) {
                if (f.endsWith(".test.js")) continue;
                copyFileSync(join("src/modules", f), join(modulesOut, f));
            }
            // root-level .d.ts type declaration files (e.g. react.d.ts)
            for (const f of readdirSync("src").filter((f) =>
                f.endsWith(".d.ts"),
            )) {
                copyFileSync(join("src", f), join("dist", f));
            }
        },
    };
}

export default [
    // 1. ESM bundle (tree-shakeable)
    {
        input: "src/index.js",
        output: {
            file: "dist/index.js",
            format: "esm",
        },
        plugins: [cssString(), svgString(), copyAssets()],
    },

    // 2. IIFE bundle (CDN / <script> tag) — includes all icons
    {
        input: "src/index.iife.js",
        output: {
            file: "dist/yumekit.min.js",
            format: "iife",
            name: "YumeKit",
        },
        plugins: [cssString(), svgString(), terser()],
    },

    // 3. Icon entrypoints
    {
        input: "src/icons/registry.js",
        output: {
            file: "dist/icons/registry.js",
            format: "esm",
        },
        plugins: [],
    },
    {
        input: "src/icons/all.js",
        output: {
            file: "dist/icons/all.js",
            format: "esm",
        },
        external: ["./registry.js", "./all-filled.js"],
        plugins: [svgString()],
    },
    {
        input: "src/icons/all-filled.js",
        output: {
            file: "dist/icons/all-filled.js",
            format: "esm",
        },
        external: ["./registry.js"],
        plugins: [svgString()],
    },

    // 4. Individual components
    ...componentNames.map((name) => ({
        input: `${componentDir}/${name}/${name}.js`,
        output: {
            file: `dist/components/${name}.js`,
            format: "esm",
            paths: componentPaths,
        },
        external: componentExternal,
        // Keep external ids as the authored relative specifiers so
        // componentExternal / componentPaths can match them; the default
        // resolves them to absolute paths first, which silently skips the
        // `paths` rewrite and emits specifiers that don't exist in dist/.
        makeAbsoluteExternalsRelative: false,
        plugins: [cssString(), svgString()],
    })),
];
