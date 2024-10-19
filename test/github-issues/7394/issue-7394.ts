import "reflect-metadata"
import { createTestingConnections } from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { assert, expect } from "chai"

describe("github issues > #7394 Graceful termination for database connection", () => {
    const gracefulShutdownSeconds = 1

    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["postgres"],
                driverSpecific: {
                    poolGracefulShutdownTimeoutMS:
                        gracefulShutdownSeconds * 1000,
                },
            })),
    )

    it("Test graceful termination - DataSource.destroy() waits until queries are complete before terminating the connections", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sleepSeconds = 0.3
                const sleepPromise = dataSource.query(
                    `SELECT pg_sleep(${sleepSeconds})`,
                )

                // Timeout for 100ms to wait for the query to start
                await new Promise((resolve) => setTimeout(resolve, 100))

                // Close the connection
                const closePromise = dataSource.destroy()

                try {
                    // Wait for both promises to resolve
                    const [sleepResult, closeResult] = await Promise.all([
                        sleepPromise,
                        closePromise,
                    ])
                    expect(sleepResult).to.be.an("array")
                    expect(sleepResult).to.have.length(1)
                    expect(sleepResult[0].pg_sleep).to.equal("") // pg_sleep returns empty string
                    expect(closeResult).to.be.undefined
                } catch (e) {
                    if (
                        e.toString() ===
                        "QueryFailedError: Connection terminated"
                    ) {
                        assert.fail(
                            "Query failed with Connection Terminated error, while expected to be closed gracefully",
                        )
                    }
                    throw e
                }
            }),
        ))

    it("Test graceful termination - DataSource.destroy() aborts if graceful shutdown takes too long ", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sleepSeconds = 15
                const sleepPromise = dataSource.query(
                    `SELECT pg_sleep(${sleepSeconds})`,
                )

                // Timeout for 100ms to wait for the query to start
                await new Promise((resolve) => setTimeout(resolve, 100))

                // Close the connection
                const closePromise = dataSource.destroy()

                const nowMs = Date.now()
                try {
                    await Promise.all([sleepPromise, closePromise])
                    assert.fail(
                        "Expected the query to be terminated due to timeout",
                    )
                } catch (e) {
                    const errMessage = e?.toString()
                    if (errMessage.includes("TypeORMError:")) {
                        expect(errMessage).to.include(
                            "TypeORMError: Driver not Connected",
                        )
                    } else if (errMessage.includes("QueryFailedError")) {
                        expect(errMessage).to.equal(
                            "QueryFailedError: Connection terminated",
                        )
                    } else {
                        throw e
                    }
                    const elapsedMs = Date.now() - nowMs
                    expect(elapsedMs).to.be.lessThan(
                        gracefulShutdownSeconds * 1000 + 100,
                    )
                }
            }),
        ))
})
