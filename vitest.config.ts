import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        include: ["test/**/*.test.ts"],
        setupFiles: ["test/utils/test-setup.ts"],
        testTimeout: 90000,
        detectAsyncLeaks: true,
        globals: true,
        maxWorkers: 4,
        watch: false,
        silent: true,
        passWithNoTests: true,
    },
})
