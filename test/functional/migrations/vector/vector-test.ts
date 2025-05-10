import "reflect-metadata"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { CreatePost0000000000001 } from "./0000000000001-CreatePost"

describe("migrations > vector type", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["postgres"],
            schemaCreate: false,
            dropSchema: true,
            migrations: [CreatePost0000000000001],
        })
    })

    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should run vector migration and create table with vector columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.runMigrations()

                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                table!
                    .findColumnByName("embedding")!
                    .type.should.be.equal("vector")
                table!
                    .findColumnByName("embeddings")!
                    .type.should.be.equal("vector")
                table!.findColumnByName("embeddings")!.isArray.should.be.true
            }),
        ))

    it("should handle vector data after migration", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.runMigrations()

                const queryRunner = connection.createQueryRunner()
                await queryRunner.query(
                    'INSERT INTO "post"("embedding", "embeddings") VALUES (\'[1,2,3]\', \'{"[4,5,6]","[7,8,9]"}\')',
                )

                const result = await queryRunner.query('SELECT * FROM "post"')
                await queryRunner.release()

                result.length.should.be.equal(1)
                result[0].embedding.should.deep.equal([1, 2, 3])
                result[0].embeddings.should.deep.equal([
                    [4, 5, 6],
                    [7, 8, 9],
                ])
            }),
        ))
})
