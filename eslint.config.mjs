import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import globals from "globals"

export default tseslint.config([
    {
        ignores: ["build/**", "node_modules/**"],
    },
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: "tsconfig.json",
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
        rules: {
            // exceptions
            "@typescript-eslint/ban-ts-comment": "warn",
            "@typescript-eslint/no-empty-object-type": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-misused-new": "warn",
            "@typescript-eslint/no-namespace": "warn",
            "@typescript-eslint/no-require-imports": "warn",
            "@typescript-eslint/no-this-alias": "warn",
            "@typescript-eslint/no-unnecessary-type-constraint": "warn",
            "@typescript-eslint/no-unsafe-declaration-merging": "warn",
            "@typescript-eslint/no-unsafe-function-type": "warn",
            "@typescript-eslint/no-unused-expressions": "warn",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_" },
            ],
            "@typescript-eslint/no-wrapper-object-types": "warn",
            "@typescript-eslint/triple-slash-reference": "warn",
            "no-async-promise-executor": "warn",
            "no-control-regex": "warn",
            "no-empty": "warn",
            "no-loss-of-precision": "warn",
            "no-prototype-builtins": "warn",
            "no-regex-spaces": "warn",

            // custom
            "prefer-const": "warn",
            "prefer-rest-params": "warn",
            "prefer-spread": "warn",
            // deprecated: stylistic
            "no-extra-semi": "warn",
        },
    },
])
