import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
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
    },
    pluginJs.configs.recommended,
];
