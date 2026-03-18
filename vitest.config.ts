import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        include: ["test/**/*.test.ts"],
        setupFiles: ["test/utils/test-setup.ts"],
        testTimeout: 90000,
        hookTimeout: 0,
        pool: "threads",
        fileParallelism: false,
        globals: true,
        chaiConfig: {
            includeStack: true,
            showDiff: true,
        },
        watch: false,
        reporters: "tree",
    },
})
