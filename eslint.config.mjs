// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [{
    // Generated build output — never lint.
    ignores: ["dist/**", "storybook-static/**"],
}, {
    languageOptions: { globals: globals.browser },
    rules: {
        // Style
        "max-len": ["error", { code: 180, ignoreTemplateLiterals: true, ignoreStrings: true, ignoreComments: true }],

        // Best practices
        "eqeqeq": ["error", "always", { null: "ignore" }],
        "no-console": "warn",
        "no-var": "error",
        "prefer-const": "error",
    },
}, pluginJs.configs.recommended, ...storybook.configs["flat/recommended"], {
    // Build/CLI scripts run in Node and are expected to log to the console.
    files: ["scripts/**/*.js"],
    languageOptions: { globals: globals.node },
    rules: { "no-console": "off" },
}, {
    // Root tooling config runs in Node.
    files: ["*.config.js", "*.config.mjs"],
    languageOptions: { globals: globals.node },
}, {
    // Tests run in the browser under web-test-runner's mocha.
    files: ["src/**/*.test.js", "test/**/*.test.js"],
    languageOptions: { globals: { ...globals.browser, ...globals.mocha } },
}];
