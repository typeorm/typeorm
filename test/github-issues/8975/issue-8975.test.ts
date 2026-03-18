import { expect } from "chai"
import { exec } from "child_process"
import { readFile, rm, writeFile } from "fs/promises"
import path from "path"
import { promisify } from "util"

const execAsync = promisify(exec)

describe("cli init command", () => {
    const cliPath = path.resolve(process.cwd(), "build/compiled/src/cli.js")
    const databaseOptions = [
        "mysql",
        "mariadb",
        "postgres",
        "cockroachdb",
        "better-sqlite3",
        // "oracle", // as always oracle have issues: dependency installation doesn't work on mac m1 due to missing oracle binaries for m1
        "mssql",
        "mongodb",
    ]
    const testProjectPath = `temp/${Date.now()}TestProject`
    const builtSrcDirectory = "build/compiled/src"

    beforeAll(async () => {
        // load package.json from the root of the project
        const packageJson = JSON.parse(await readFile("./package.json", "utf8"))

        // init command is taking typeorm version from package.json
        // so ensure we are working against local build
        packageJson.version = `file:../${builtSrcDirectory}`

        // write the modified package.json to the build directory
        await writeFile(
            `./${builtSrcDirectory}/package.json`,
            JSON.stringify(packageJson, null, 4),
        )
    })

    afterAll(() => rm(`./${builtSrcDirectory}/package.json`, { force: true }))

    afterEach(() =>
        rm(`./${testProjectPath}`, { recursive: true, force: true }),
    )

    for (const databaseOption of databaseOptions) {
        it(`should work with ${databaseOption} option`, async () => {
            const { stderr } = await execAsync(
                `node "${cliPath}" init --name ${testProjectPath} --database ${databaseOption}`,
            )
            expect(stderr).to.be.empty
        }, 120000)
    }
})
