import { expect } from "chai"
import { execFileSync } from "child_process"
import {
    existsSync,
    mkdtempSync,
    mkdirSync,
    symlinkSync,
    writeFileSync,
    rmSync,
} from "fs"
import { tmpdir } from "os"
import { resolve, join } from "path"

describe("PostgreSQL public adapter API", () => {
    it("compiles and executes an external consumer against the built public package", () => {
        const packageRoot = resolve(__dirname, "../../../../..")
        const directory = mkdtempSync(
            join(tmpdir(), "typeorm-adapter-consumer-"),
        )
        try {
            mkdirSync(join(directory, "node_modules"))
            const published = join(packageRoot, "build/package")
            const dependency = join(directory, "node_modules/typeorm")
            if (existsSync(join(published, "index.js"))) {
                symlinkSync(published, dependency, "junction")
            } else {
                // Regular test CI only runs compile. Exercise those emitted public
                // exports too; package verification uses the real manifest above.
                mkdirSync(dependency)
                symlinkSync(
                    join(packageRoot, "build/compiled/src"),
                    join(dependency, "lib"),
                    "junction",
                )
                writeFileSync(
                    join(dependency, "package.json"),
                    JSON.stringify({
                        name: "typeorm",
                        main: "./lib/index.js",
                        types: "./lib/index.d.ts",
                        exports: {
                            ".": {
                                types: "./lib/index.d.ts",
                                default: "./lib/index.js",
                            },
                        },
                    }),
                )
            }
            writeFileSync(
                join(directory, "consumer.ts"),
                `
import { DataSource, QueryResult, PgDriverAdapter, PostgresDialect, AbstractPostgresDialect } from "typeorm"
import type { PostgresDriverAdapter, PostgresConnectionRelease, PostgresDataSourceOptions, PostgresConnectionCredentialsOptions } from "typeorm"
const release: PostgresConnectionRelease = () => Promise.resolve()
const adapter: PostgresDriverAdapter = {
    createPool: (_options: PostgresDataSourceOptions, _credentials: PostgresConnectionCredentialsOptions) => Promise.resolve({}),
    closePool: () => Promise.resolve(),
    acquire: () => Promise.resolve([{}, release]),
    query: () => Promise.resolve({ values: [] }),
    normalizeResult: () => new QueryResult(),
}
const source = new DataSource({ type: "postgres", adapter })
if (!(source.driver instanceof PostgresDialect) || !(source.driver instanceof AbstractPostgresDialect)) throw new Error("dialect exports differ from runtime classes")
if (typeof PgDriverAdapter !== "function") throw new Error("default adapter missing")
`,
            )
            writeFileSync(
                join(directory, "tsconfig.json"),
                JSON.stringify({
                    compilerOptions: {
                        target: "ES2022",
                        module: "Node16",
                        moduleResolution: "Node16",
                        strict: true,
                        skipLibCheck: true,
                        outDir: "out",
                    },
                    files: ["consumer.ts"],
                }),
            )
            execFileSync(
                process.execPath,
                [require.resolve("typescript/bin/tsc"), "-p", directory],
                { encoding: "utf8" },
            )
            const output = execFileSync(
                process.execPath,
                [join(directory, "out/consumer.js")],
                { encoding: "utf8" },
            )
            expect(output).to.equal("")
            const esm = execFileSync(
                process.execPath,
                [
                    "--input-type=module",
                    "-e",
                    'import { PostgresDialect, PgDriverAdapter } from "typeorm"; if (!PostgresDialect || !PgDriverAdapter) throw new Error("missing ESM exports")',
                ],
                { cwd: directory, encoding: "utf8" },
            )
            expect(esm).to.equal("")
        } finally {
            rmSync(directory, { recursive: true, force: true })
        }
    })
})
