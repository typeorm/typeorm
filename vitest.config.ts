import { defineConfig } from "vitest/config"
import swc from "unplugin-swc"

export default defineConfig({
    plugins: [swc.vite()],
    test: {
        include: ["test/**/*.test.ts"],
        setupFiles: ["test/utils/test-setup.ts"],
        globals: true,
        testTimeout: 90000,
        pool: "threads",
        maxWorkers: 4,
    },
})
