import { expect } from "chai"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { run as jscodeshift } from "jscodeshift/src/Runner"
import {
    DEFAULT_IGNORE_PATTERNS,
    buildIgnorePatterns,
} from "../../src/cli/run-transforms"

describe("run-transforms", () => {
    describe("DEFAULT_IGNORE_PATTERNS", () => {
        it("excludes ambient type declaration files by default", () => {
            expect(DEFAULT_IGNORE_PATTERNS).to.include("**/*.d.ts")
        })
    })

    describe("buildIgnorePatterns", () => {
        it("returns the defaults when no user patterns are supplied", () => {
            expect(buildIgnorePatterns()).to.deep.equal(DEFAULT_IGNORE_PATTERNS)
        })

        it("returns the defaults when user patterns are undefined", () => {
            expect(buildIgnorePatterns(undefined)).to.deep.equal(
                DEFAULT_IGNORE_PATTERNS,
            )
        })

        it("merges user patterns after the defaults so defaults are preserved", () => {
            const result = buildIgnorePatterns(["**/generated*", "**/e2e/**"])
            expect(result).to.deep.equal([
                ...DEFAULT_IGNORE_PATTERNS,
                "**/generated*",
                "**/e2e/**",
            ])
        })

        it("does not mutate the defaults when user patterns are provided", () => {
            const before = [...DEFAULT_IGNORE_PATTERNS]
            buildIgnorePatterns(["**/foo"])
            expect(DEFAULT_IGNORE_PATTERNS).to.deep.equal(before)
        })
    })

    describe("jscodeshift integration with DEFAULT_IGNORE_PATTERNS", () => {
        // Exercises the end-to-end guard: jscodeshift must honor the default
        // ignore and leave ambient declaration files untouched even when the
        // transform would otherwise rewrite them.
        it("does not visit .d.ts files during a run", async () => {
            const tmpDir = await fs.mkdtemp(
                path.join(os.tmpdir(), "codemod-dts-"),
            )
            try {
                const original = 'export type Foo = "bar"\n'
                const dtsPath = path.join(tmpDir, "types.d.ts")
                const tsPath = path.join(tmpDir, "code.ts")
                await fs.writeFile(dtsPath, original)
                await fs.writeFile(tsPath, original)

                // A minimal transform that appends a marker to every file
                // jscodeshift hands it.
                const transformPath = path.join(tmpDir, "transform.cjs")
                await fs.writeFile(
                    transformPath,
                    "module.exports = (file) => file.source + '// MARKER\\n'\n",
                )

                // Silence jscodeshift's progress output for the duration of
                // the run — mocha's reporter doesn't need it.
                const originalWrite = process.stdout.write.bind(process.stdout)
                process.stdout.write = (() =>
                    true) as typeof process.stdout.write
                try {
                    await jscodeshift(transformPath, [tmpDir], {
                        dry: false,
                        verbose: 0,
                        extensions: "ts,tsx,js,jsx",
                        parser: "tsx",
                        ignorePattern: buildIgnorePatterns(),
                    })
                } finally {
                    process.stdout.write = originalWrite
                }

                const dtsAfter = await fs.readFile(dtsPath, "utf8")
                expect(dtsAfter).to.equal(original)

                const tsAfter = await fs.readFile(tsPath, "utf8")
                expect(tsAfter).to.include("// MARKER")
            } finally {
                await fs.rm(tmpDir, { recursive: true, force: true })
            }
        })
    })
})
