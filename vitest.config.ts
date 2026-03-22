import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        include: ["test/**/*.test.ts"],
        setupFiles: ["test/utils/test-setup.ts"],
        testTimeout: 90000,
        hookTimeout: 0,
        pool: "forks",
        fileParallelism: false,
        globals: true,
        isolate: false,
        deps: {
            optimizer: {
                ssr: {
                    enabled: true,
                },
                include: ["src", "test"],
            },
        },
        chaiConfig: {
            includeStack: true,
            showDiff: true,
        },
        watch: false,
        reporters: "tree",
    },
    cache: true,
    dangerouslyIgnoreUnhandledErrors: true,
})
