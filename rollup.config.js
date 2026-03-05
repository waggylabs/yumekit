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
const componentFiles = readdirSync(componentDir).filter((f) =>
    f.endsWith(".js"),
);

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
            // modules/
            const modulesOut = "dist/modules";
            if (!existsSync(modulesOut))
                mkdirSync(modulesOut, { recursive: true });
            for (const f of readdirSync("src/modules")) {
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
        external: ["./registry.js"],
        plugins: [svgString()],
    },

    // 4. Individual components
    ...componentFiles.map((file) => ({
        input: `${componentDir}/${file}`,
        output: {
            file: `dist/components/${file}`,
            format: "esm",
        },
        external: ["../icons/registry.js", "../modules/helpers.js"],
        plugins: [cssString(), svgString()],
    })),
];
