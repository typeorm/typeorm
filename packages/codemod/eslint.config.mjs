import js from "@eslint/js"
import chaiFriendly from "eslint-plugin-chai-friendly"
import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import ts from "typescript-eslint"

export default defineConfig([
    globalIgnores(["dist/**", "node_modules/**", "test/**/fixtures/**"]),

    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: ts.parser,
            parserOptions: {
                project: "tsconfig.json",
            },
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            js,
            ts,
        },
        extends: [js.configs.recommended, ...ts.configs.recommendedTypeChecked],
        rules: {
            // jscodeshift AST nodes are loosely typed — these are unavoidable
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-return": "off",
        },
    },

    {
        files: ["test/**/*.ts"],
        ...chaiFriendly.configs.recommendedFlat,
    },
])
