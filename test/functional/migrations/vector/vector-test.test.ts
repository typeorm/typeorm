import "reflect-metadata"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { CreatePost0000000000001 } from "./0000000000001-CreatePost"
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
                    .findColumnByName("embedding_three_dimensions")!
                    .type.should.be.equal("vector")
                table!
                    .findColumnByName("embedding_three_dimensions")!
                    .length!.should.be.equal("3")
                table!
                    .findColumnByName("halfvec_embedding")!
                    .type.should.be.equal("halfvec")
                table!
                    .findColumnByName("halfvec_four_dimensions")!
                    .type.should.be.equal("halfvec")
                table!
                    .findColumnByName("halfvec_four_dimensions")!
                    .length!.should.be.equal("4")
            }),
        ))

    it("should handle vector data after migration", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.runMigrations()

                const queryRunner = connection.createQueryRunner()
                await queryRunner.query(
                    'INSERT INTO "post"("embedding", "embedding_three_dimensions", "halfvec_embedding", "halfvec_four_dimensions") VALUES (\'[1,2,3,4]\', \'[4,5,6]\', \'[1.5,2.5]\', \'[1,2,3,4]\')',
                )

                const result = await queryRunner.query('SELECT * FROM "post"')
                await queryRunner.release()

                result.length.should.be.equal(1)
                result[0].embedding.should.equal("[1,2,3,4]")
                result[0].embedding_three_dimensions.should.equal("[4,5,6]")
                result[0].halfvec_embedding.should.equal("[1.5,2.5]")
                result[0].halfvec_four_dimensions.should.equal("[1,2,3,4]")
            }),
        ))
})
