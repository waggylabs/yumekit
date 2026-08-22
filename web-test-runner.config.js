import { playwrightLauncher } from "@web/test-runner-playwright";
import { sendKeysPlugin } from "@web/test-runner-commands/plugins";

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

function svgStringPlugin() {
    return {
        name: "svg-string",
        transform(context) {
            if (context.path.endsWith(".svg")) {
                return {
                    body: `export default ${JSON.stringify(context.body)};`,
                    headers: { "content-type": "application/javascript" },
                };
            }
        },
    };
}

/**
 * Browsers the suite runs against. Chromium, Firefox, and WebKit stand in for
 * the three engines the library supports; a rendering bug in one is routinely
 * invisible in the others. Narrow the set while iterating with the `BROWSERS`
 * env var (`BROWSERS=chromium npm test`) — CI always runs all three.
 */
const ALL_PRODUCTS = ["chromium", "firefox", "webkit"];

const products = (process.env.BROWSERS || "")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter((name) => ALL_PRODUCTS.includes(name));

export default {
    nodeResolve: true,
    files: ["src/**/*.test.js"],
    rootDir: ".",
    browserStartTimeout: 60000,
    testsStartTimeout: 60000,
    // The default 120s covers Chromium comfortably but not a full run on the
    // other two engines, which are slower to work through 60+ files.
    testsFinishTimeout: 300000,
    // Capped rather than left to default (half the host's cores): Firefox and
    // WebKit go flaky once many pages compete for the machine, and a lost
    // session is reported as a missing test rather than a failure. Four keeps
    // the three-engine run under a minute with room to spare.
    concurrency: 4,
    browsers: (products.length ? products : ALL_PRODUCTS).map((product) =>
        playwrightLauncher({ product }),
    ),
    plugins: [cssStringPlugin(), svgStringPlugin(), sendKeysPlugin()],
};
