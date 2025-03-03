import { expect } from "chai"
import { exec } from "child_process"
import { readFile, writeFile, chmod, unlink, rmdir } from "fs/promises"
import { dirname } from "path"

describe("cli init command", () => {
    const cliPath = `${dirname(dirname(dirname(__dirname)))}/src/cli.js`
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
    const testProjectName = Date.now() + "TestProject"
    const builtSrcDirectory = "build/compiled/src"

    before(async () => {
        const chmodCli = async () => {
            await expect(chmod(cliPath, 0o755)).to.not.be.rejected
        }

        const copyPackageJson = async () => {
            // load package.json from the root of the project
            const packageJson = JSON.parse(
                await readFile("./package.json", "utf8"),
            )
            packageJson.version = `0.0.0` // install no version but
            packageJson.installFrom = `file:../${builtSrcDirectory}` // use the built src directory
            // write the modified package.json to the build directory
            await writeFile(
                `./${builtSrcDirectory}/package.json`,
                JSON.stringify(packageJson, null, 4),
            )
        }

        await Promise.all([chmodCli(), copyPackageJson()])
    })

    after(async () => {
        await unlink(`./${builtSrcDirectory}/package.json`)
    })

    afterEach(async () => {
        await rmdir(`./${testProjectName}`, { recursive: true })
    })

    for (const databaseOption of databaseOptions) {
        it(`should work with ${databaseOption} option`, (done) => {
            exec(
                `${cliPath} init --name ${testProjectName} --database ${databaseOption}`,
                (error, stdout, stderr) => {
                    if (error) console.log(error)
                    expect(error).to.not.exist
                    expect(stderr).to.be.empty

                    done()
                },
            )
        }).timeout(120000)
    }
})
