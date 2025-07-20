import { expect } from "chai"
import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { UuidEntity } from "./entity/UuidEntity"
import { DriverUtils } from "../../../../../src/driver/DriverUtils"

describe("database schema > column types > mysql > uuid", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [UuidEntity],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mysql", "mariadb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should create table with with varchar with length 36 when version is mysql", () =>
        Promise.all(
            connections.map(async (connection) => {
                const uuidRepository = connection.getRepository(UuidEntity)

                // seems there is an issue with the persisting id that crosses over from mysql to mariadb
                const uuidEntity: UuidEntity = {
                    id: "ceb2897c-a1cf-11ed-8dbd-040300000000",
                }
                await uuidRepository.save(uuidEntity)

                const columnTypes: {
                    DATA_TYPE: string
                    CHARACTER_MAXIMUM_LENGTH: string
                }[] = await connection.sql`
                        SELECT
                            DATA_TYPE,
                            CHARACTER_MAXIMUM_LENGTH
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE
                            TABLE_SCHEMA = ${connection.driver.database}
                            AND TABLE_NAME = 'UuidEntity'
                            AND COLUMN_NAME = 'id'`

                const hasNativeUuidSupport =
                    connection.driver.options.type === "mariadb" &&
                    DriverUtils.isReleaseVersionOrGreater(
                        connection.driver,
                        "10.7",
                    )
                const expectedType = hasNativeUuidSupport ? "uuid" : "varchar"
                const expectedLength = hasNativeUuidSupport ? null : "36"

                columnTypes.forEach(
                    ({ DATA_TYPE, CHARACTER_MAXIMUM_LENGTH }) => {
                        expect(DATA_TYPE).to.equal(expectedType)
                        expect(CHARACTER_MAXIMUM_LENGTH).to.equal(
                            expectedLength,
                        )
                    },
                )
            }),
        ))
})
