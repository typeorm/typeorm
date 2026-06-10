import js from "@eslint/js"
import chaiFriendly from "eslint-plugin-chai-friendly"
import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import ts from "typescript-eslint"

const __dirname = import.meta.dirname

export default defineConfig([
    globalIgnores([
        "dist/**",
        "examples/**",
        "node_modules/**",
        "test/**/fixtures/**",
    ]),

    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: ts.parser,
            parserOptions: {
                tsconfigRootDir: __dirname,
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
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
        },
    },

    {
        files: ["test/**/*.ts"],
        ...chaiFriendly.configs.recommendedFlat,
    },
])
