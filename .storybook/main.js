import { readFileSync } from "fs";

export default {
    stories: ["../src/**/*.stories.js"],
    addons: ["@storybook/addon-docs"],
    framework: {
        name: "@storybook/html-vite",
        options: {},
    },
    async viteFinal(config) {
        config.plugins = config.plugins || [];

        // Match the svg/css string transforms used in rollup.config.js.
        // Must use the load hook (not transform) so we intercept before Vite's
        // asset pipeline converts SVGs into data URLs.
        config.plugins.unshift({
            name: "svg-string",
            enforce: "pre",
            load(id) {
                if (id.endsWith(".svg")) {
                    const content = readFileSync(id, "utf-8");
                    return `export default ${JSON.stringify(content)};`;
                }
            },
        });
        config.plugins.unshift({
            name: "css-to-inline",
            enforce: "pre",
            transform(code, id) {
                // Rewrite bare CSS imports in src/ JS files to ?inline so Vite
                // returns CSS as a string instead of a style-injection module.
                if (!/\.(js|ts|mjs)$/.test(id) || !id.includes("/src/")) return null;
                if (!code.includes(".css")) return null;
                const next = code.replace(
                    /from\s+(['"])([^'"]*\.css)\1/g,
                    (_, q, p) => `from ${q}${p}?inline${q}`,
                );
                return next !== code ? { code: next, map: null } : null;
            },
        });

        return config;
    },
};
