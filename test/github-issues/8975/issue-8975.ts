import { expect } from "chai"
import { exec } from "child_process"
import { dirname } from "path"
import { promises as fs } from 'fs'

describe.only("cli init command", () => {
    const cliPath = `${dirname(dirname(dirname(__dirname)))}/src/cli.ts`
    const databaseOptions = [
        "mysql",
        "mariadb",
        "postgres",
        "cockroachdb",
        "sqlite",
        "better-sqlite3",
        "oracle",
        "mssql",
        "mongodb",
    ]

    for (const databaseOption of databaseOptions) {
        it(`should work with ${databaseOption} option`,  async () => {
            const projectName = await new Promise((resolve, reject) => {
                const testProjectName = `TestProject${process.hrtime.bigint()}`
                exec(
                    `npx --yes cross-env TYPEORM_TEST=true node -r @swc-node/register ${cliPath} init --name ${testProjectName} --database ${databaseOption}`,
                    (error, stdout, stderr) => {
                        expect(error).to.not.exist
                        if (error) {
                            reject(error)
                        }
                        expect(stderr).to.be.empty
                        if (stderr) {
                            reject(stderr)
                        }
                        resolve(testProjectName)
                    },
                )
            })
            await fs.rm(`./${projectName}`, { recursive: true, force: true })
        }).timeout(90000)
    }
})
