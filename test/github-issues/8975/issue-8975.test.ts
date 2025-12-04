import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import { exec } from "child_process"
import { readFile, rm, unlink, writeFile } from "fs/promises"

describe("cli init command", () => {
    const cliPath = `${__dirname}/../../../src/cli.js`
    const databaseOptions = [
        "mysql",
        "mariadb",
        "postgres",
        "cockroachdb",
        "sqlite",
        "better-sqlite3",
        // "oracle", // as always oracle have issues: dependency installation doesn't work on mac m1 due to missing oracle binaries for m1
        "mssql",
        "mongodb",
    ]
    const testProjectPath = `temp/${Date.now()}TestProject`
    const builtSrcDirectory = "build/compiled/src"

    before(async () => {
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

    after(async () => {
        await unlink(`./${builtSrcDirectory}/package.json`)
    })

    afterEach(async () => {
        await rm(`./${testProjectPath}`, { recursive: true, force: true })
    })

    for (const databaseOption of databaseOptions) {
        it(`should work with ${databaseOption} option`, {
            timeout: 120000,
        }, async() => {
            await new Promise((resolve) => {
                exec(
                    `node ${cliPath} init --name ${testProjectPath} --database ${databaseOption}`,
                    (error, _stdout, stderr) => {
                        if (error) console.log(error)
                        expect(error).to.not.exist
                        expect(stderr).to.be.empty
                        
                        resolve(undefined);
                    },
                )
            })
        })
    }
})
