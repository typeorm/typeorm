import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        coverage: {
            provider: "v8",
            reporter: "lcov",
        },
        isolate: false,
        globals: true,
        setupFiles: ["./test/utils/test-setup.ts"],
        dir: "./test",
        testTimeout: 90_000,
        reporters: ['default'],
        passWithNoTests: false,
        pool: "forks",
    }
})