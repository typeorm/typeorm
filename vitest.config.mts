import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc';

export default defineConfig({
    esbuild: false,
    plugins: [
        swc.vite(),
    ],
    test: {
        globals: true,
        bail: 1,
        setupFiles: ["./test/utils/test-setup.js"],
        dir: "./test",
        testTimeout: 90_000,
        reporters: ['default'],
        maxWorkers: 1,
        maxConcurrency: 1,
    }
})