import js from "@eslint/js"
import chaiFriendly from "eslint-plugin-chai-friendly"
import { defineConfig, globalIgnores } from "eslint/config"
import ts from "typescript-eslint"

const __dirname = import.meta.dirname

export default defineConfig([
    globalIgnores(["dist/**", "node_modules/**"]),

    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: ts.parser,
            parserOptions: {
                tsconfigRootDir: __dirname,
                project: "tsconfig.json",
            },
        },
        plugins: {
            js,
            ts,
        },
        extends: [js.configs.recommended, ...ts.configs.recommendedTypeChecked],
    },

    {
        files: ["test/**/*.ts"],
        ...chaiFriendly.configs.recommendedFlat,
    },
])
