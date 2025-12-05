import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc';

export default defineConfig({
    esbuild: false,
    plugins: [
        swc.vite({
            tsconfigFile: './tsconfig.json',
            sourceMaps: true,
        }),
    ],
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
        maxWorkers: 2,
    }
})