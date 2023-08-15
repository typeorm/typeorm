import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { DataSource, MigrationExecutor } from "../../../src"
import * as http from "http"
import { SpannerConnectionOptions } from "../../../src/driver/spanner/SpannerConnectionOptions"

describe("github issues > #9725 Migrations do not work with Spanner", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                migrations: [__dirname + "/migration/*.js"],
                enabledDrivers: ["spanner"],
                schemaCreate: false,
                dropSchema: true,
            })),
    )
    after(() => closeTestingConnections(connections))

    it("migration is executed successfully", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (connection.driver.options.type === "spanner") {
                    const option = connection.driver
                        .options as SpannerConnectionOptions
                    await createSpannerInstanceIfNotExists(
                        option.projectId!,
                        option.instanceId!,
                    )
                    await createSpannerDatabaseIfNotExists(
                        option.projectId!,
                        option.instanceId!,
                        option.databaseId!,
                    )
                }

                const migrationExecutor = new MigrationExecutor(connection)
                await connection.runMigrations()
                const executedMigrations =
                    await migrationExecutor.getExecutedMigrations()
                executedMigrations
                    .map((m) => m.name)
                    .should.eql([
                        "ExampleMigrationTwo1530542855524",
                        "ExampleMigration1530542855524",
                    ])
            }),
        ))

    it("undoLastMigration is executed successfully", () =>
        Promise.all(
            connections.map(async (connection) => {
                const migrationExecutor = new MigrationExecutor(connection)
                await connection.undoLastMigration()
                const executedMigrations =
                    await migrationExecutor.getExecutedMigrations()
                const pendingMigrations =
                    await migrationExecutor.getPendingMigrations()
                executedMigrations
                    .map((m) => m.name)
                    .should.eql(["ExampleMigration1530542855524"])
                pendingMigrations
                    .map((m) => m.name)
                    .should.eql(["ExampleMigrationTwo1530542855524"])
            }),
        ))
})

async function createSpannerDatabaseIfNotExists(
    projectId: string,
    instanceId: string,
    databaseId: string,
): Promise<string> {
    // create spanner database on spanner emulator
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            createStatement: `CREATE DATABASE \`${databaseId}\``,
        })
        const options = {
            hostname: process.env.SPANNER_EMULATOR_HOST!.split(":")[0],
            port: 9020,
            path: `/v1/projects/${projectId}/instances/${instanceId}/databases`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(data),
            },
        }
        const req = http.request(options, (res) => {
            let responseData = ""
            res.on("data", (chunk) => {
                responseData += chunk
            })
            res.on("end", () => {
                // 200:success, 409:already exists
                if (res.statusCode === 200 || res.statusCode === 409) {
                    resolve(responseData)
                } else {
                    reject(
                        new Error(
                            `Server responded with status code: ${res.statusCode} and message: ${responseData}`,
                        ),
                    )
                }
            })
        })
        req.on("error", (e) => {
            reject(e)
        })
        req.write(data)
        req.end()
    })
}
async function createSpannerInstanceIfNotExists(
    projectId: string,
    instanceId: string,
): Promise<string> {
    // create spanner instance on spanner emulator
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            instanceId,
        })
        const options = {
            hostname: process.env.SPANNER_EMULATOR_HOST!.split(":")[0],
            port: 9020,
            path: `/v1/projects/${projectId}/instances`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(data),
            },
        }
        const req = http.request(options, (res) => {
            let responseData = ""
            res.on("data", (chunk) => {
                responseData += chunk
            })
            res.on("end", () => {
                // 200:success, 409:already exists
                if (res.statusCode === 200 || res.statusCode === 409) {
                    resolve(responseData)
                } else {
                    reject(
                        new Error(
                            `Server responded with status code: ${res.statusCode} and message: ${responseData}`,
                        ),
                    )
                }
            })
        })
        req.on("error", (e) => {
            reject(e)
        })
        req.write(data)
        req.end()
    })
}
