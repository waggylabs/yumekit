import { playwrightLauncher } from "@web/test-runner-playwright";

function cssStringPlugin() {
    return {
        name: "css-string",
        transform(context) {
            if (context.path.endsWith(".css")) {
                return {
                    body: `export default ${JSON.stringify(context.body)};`,
                    headers: { "content-type": "application/javascript" },
                };
            }
        },
    };
}

export default {
    nodeResolve: true,
    files: ["tests/**/*.test.js"],
    rootDir: ".",
    browserStartTimeout: 20000,
    browsers: [playwrightLauncher({ product: "chromium" })],
    plugins: [cssStringPlugin()],
};
