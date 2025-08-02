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

    it("should create table with appropriate UUID column type based on database version", () =>
        Promise.all(
            connections.map(async (connection) => {
                const uuidRepository = connection.getRepository(UuidEntity)

                // seems there is an issue with the persisting id that crosses over from mysql to mariadb
                const uuidEntity: UuidEntity = {
                    id: "ceb2897c-a1cf-11ed-8dbd-040300000000",
                }
                await uuidRepository.save(uuidEntity)

                const queryRunner = connection.createQueryRunner()
                const uuidTable = await queryRunner.getTable("uuid_entity")
                await queryRunner.release()

                const hasNativeUuidSupport =
                    connection.driver.options.type === "mariadb" &&
                    DriverUtils.isReleaseVersionOrGreater(
                        connection.driver,
                        "10.7",
                    )
                const expectedType = hasNativeUuidSupport ? "uuid" : "varchar"
                const expectedLength = hasNativeUuidSupport ? "" : "36"

                const idColumn = uuidTable!.findColumnByName("id")
                expect(idColumn?.type).to.equal(expectedType)
                expect(idColumn?.length).to.equal(expectedLength)
            }),
        ))
})
