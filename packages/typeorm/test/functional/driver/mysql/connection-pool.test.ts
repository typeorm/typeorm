import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

// https://github.com/typeorm/typeorm/issues/13032
describe("driver > mysql > connection pool", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [],
            enabledDrivers: ["mariadb", "mysql"],
            driverSpecific: {
                poolSize: 1,
            },
        })
        for (const dataSource of dataSources) {
            await dataSource.query("DROP PROCEDURE IF EXISTS raise_error")
            await dataSource.query(
                "CREATE PROCEDURE raise_error(IN error_number INT) SIGNAL SQLSTATE 'HY000' SET MYSQL_ERRNO = error_number",
            )
        }
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(async () => {
        for (const dataSource of dataSources)
            await dataSource.query("DROP PROCEDURE IF EXISTS raise_error")
        await closeTestingConnections(dataSources)
    })

    const getConnectionId = async (dataSource: DataSource) => {
        const [{ id }] = await dataSource.query("SELECT CONNECTION_ID() AS id")
        return id
    }

    it("should discard the connection when a query fails with a read-only error", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // ER_OPTION_PREVENTS_STATEMENT, ER_CANT_EXECUTE_IN_READ_ONLY_TRANSACTION, ER_READ_ONLY_MODE
                for (const errno of [1290, 1792, 1836]) {
                    const connectionId = await getConnectionId(dataSource)

                    await expect(
                        dataSource.query(`CALL raise_error(${errno})`),
                    ).to.eventually.be.rejected.then((err) => {
                        expect(err.driverError?.errno).to.equal(errno)
                    })

                    expect(await getConnectionId(dataSource)).to.not.equal(
                        connectionId,
                    )
                }
            }),
        ))

    it("should discard the connection when a streamed query fails with a read-only error", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const connectionId = await getConnectionId(dataSource)

                const queryRunner = dataSource.createQueryRunner()
                try {
                    const readStream = await queryRunner.stream(
                        "CALL raise_error(1290)",
                    )
                    readStream.resume()
                    await expect(
                        new Promise<void>((ok, fail) => {
                            readStream.once("end", ok)
                            readStream.once("error", fail)
                        }),
                    ).to.eventually.be.rejected.then((err) => {
                        expect(err.errno).to.equal(1290)
                    })
                } finally {
                    await queryRunner.release()
                }

                expect(await getConnectionId(dataSource)).to.not.equal(
                    connectionId,
                )
            }),
        ))

    it("should return the connection to the pool when a query fails with another error", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const connectionId = await getConnectionId(dataSource)

                await expect(
                    dataSource.query("CALL raise_error(1644)"),
                ).to.eventually.be.rejected.then((err) => {
                    expect(err.driverError?.errno).to.equal(1644)
                })

                expect(await getConnectionId(dataSource)).to.equal(connectionId)
            }),
        ))

    it("should roll back, rethrow the read-only error and discard the connection in a transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const connectionId = await getConnectionId(dataSource)

                const queryRunner = dataSource.createQueryRunner()
                try {
                    await queryRunner.startTransaction()
                    await expect(
                        queryRunner.query("CALL raise_error(1290)"),
                    ).to.eventually.be.rejected.then((err) => {
                        expect(err.driverError?.errno).to.equal(1290)
                    })
                    await queryRunner.rollbackTransaction()
                } finally {
                    await queryRunner.release()
                }

                expect(await getConnectionId(dataSource)).to.not.equal(
                    connectionId,
                )
            }),
        ))
})
