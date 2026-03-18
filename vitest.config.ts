import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        include: ["test/**/*.test.ts"],
        setupFiles: ["test/utils/test-setup.ts"],
        reporters: "tree",
        testTimeout: 90000,
        detectAsyncLeaks: true,
        pool: "threads",
        fileParallelism: true,
        globals: true,
        maxWorkers: 4,
        watch: false,
        silent: "passed-only",
        passWithNoTests: true,
        typecheck: {
            include: ["test/**/*.ts"],
            tsconfig: "test/tsconfig.json",
        },
        chaiConfig: {
            includeStack: true,
        },
    },
})
