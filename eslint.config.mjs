import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import globals from "globals"

export default tseslint.config([
    {
        ignores: [
            "build/**",
            "node_modules/**",
            "sample/playground/**",
            "docs/**",
        ],
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
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommendedTypeChecked,
        ],
        rules: {
            // exceptions from recommended
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
            "@typescript-eslint/no-wrapper-object-types": "off",
            "@typescript-eslint/triple-slash-reference": "warn",

            // exceptions from recommended type checked
            "@typescript-eslint/no-base-to-string": "off",
            "@typescript-eslint/no-misused-promises": [
                "error",
                {
                    checksConditionals: false,
                    checksVoidReturn: false,
                },
            ],
            "@typescript-eslint/no-redundant-type-constituents": "warn",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/prefer-promise-reject-errors": "off",
            "@typescript-eslint/restrict-plus-operands": "warn",
            "@typescript-eslint/restrict-template-expressions": "warn",
            "@typescript-eslint/unbound-method": [
                "warn",
                { ignoreStatic: true },
            ],

            // temporary exceptions
            "@typescript-eslint/await-thenable": "off",
            "@typescript-eslint/no-unnecessary-type-assertion": "off",
            "@typescript-eslint/require-await": "off",

            // exceptions for eslint
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
        },
    },
])
