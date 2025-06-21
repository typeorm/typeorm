import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("query runner > drop foreign keys", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly drop multiple foreign keys in parallel", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                let table = await queryRunner.getTable("student")
                table!.foreignKeys.length.should.be.equal(2)

                // Test dropping multiple foreign keys at once
                await queryRunner.dropForeignKeys(table!, table!.foreignKeys)

                table = await queryRunner.getTable("student")
                table!.foreignKeys.length.should.be.equal(0)

                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("student")
                table!.foreignKeys.length.should.be.equal(2)

                await queryRunner.release()
            }),
        ))

    it("should correctly drop multiple indices in parallel", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                let table = await queryRunner.getTable("student")
                const initialIndexCount = table!.indices.length

                if (initialIndexCount > 0) {
                    // Test dropping multiple indices at once
                    await queryRunner.dropIndices(table!, table!.indices)

                    table = await queryRunner.getTable("student")
                    table!.indices.length.should.be.equal(0)

                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("student")
                    table!.indices.length.should.be.equal(initialIndexCount)
                }

                await queryRunner.release()
            }),
        ))
})
