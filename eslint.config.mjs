import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import globals from "globals"

export default tseslint.config([
    {
        ignores: [
            "build/**",
            "docs/**",
            "node_modules/**",
            "sample/playground/**",
            "temp/**",
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
            // exceptions from typescript-eslint/recommended
            "@typescript-eslint/ban-ts-comment": "warn",
            "@typescript-eslint/no-empty-object-type": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
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
            "prefer-const": ["error", { destructuring: "all" }],

            // exceptions from typescript-eslint/recommended-type-checked
            "@typescript-eslint/no-base-to-string": "off",
            "@typescript-eslint/no-misused-promises": [
                "error",
                {
                    checksConditionals: false,
                    checksVoidReturn: false,
                },
            ],
            "@typescript-eslint/no-redundant-type-constituents": "warn",
            "@typescript-eslint/no-unnecessary-type-assertion": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/prefer-promise-reject-errors": "off",
            "@typescript-eslint/require-await": "warn",
            "@typescript-eslint/restrict-plus-operands": "warn",
            "@typescript-eslint/restrict-template-expressions": "warn",
            "@typescript-eslint/unbound-method": [
                "warn",
                { ignoreStatic: true },
            ],

            // exceptions for eslint/recommended
            "no-async-promise-executor": "warn",
            "no-control-regex": "warn",
            "no-empty": "warn",
            "no-loss-of-precision": "warn",
            "no-prototype-builtins": "warn",
            "no-regex-spaces": "warn",
        },
    },
])
