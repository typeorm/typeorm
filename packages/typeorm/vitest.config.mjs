import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import swc from "unplugin-swc"

export default defineConfig({
    plugins: [
        swc.vite({
            jsc: {
                parser: {
                    syntax: "typescript",
                    decorators: true,
                },
                transform: {
                    legacyDecorator: true,
                    decoratorMetadata: true,
                },
            },
        }),
    ],
    resolve: {
        alias: [
            {
                // Fixtures use source imports for tsc, but exercise the compiled
                // CommonJS library under Vitest, just like a published package.
                find: /^(?:\.\.\/)+src\/index$/,
                replacement: fileURLToPath(
                    new URL("./build/compiled/src/index.js", import.meta.url),
                ),
            },
        ],
    },
    test: {
        include: ["test/vitest/**/*.test.mjs"],
    },
})
