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
                table!
                    .findColumnByName("sparse_embedding")!
                    .type.should.be.equal("sparsevec")
                table!
                    .findColumnByName("sparse_embedding")!
                    .length!.should.be.equal("5")
                table!
                    .findColumnByName("bit_vector")!
                    .type.should.be.equal("bit")
                table!
                    .findColumnByName("bit_vector")!
                    .length!.should.be.equal("16")
            }),
        ))

    it("should handle vector data after migration", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.runMigrations()

                const queryRunner = connection.createQueryRunner()
                await queryRunner.query(
                    'INSERT INTO "post"("embedding", "embedding_three_dimensions", "halfvec_embedding", "halfvec_four_dimensions", "sparse_embedding", "bit_vector") VALUES (\'[1,2,3,4]\', \'[4,5,6]\', \'[1.5,2.5]\', \'[1,2,3,4]\', \'{1:1.5,5:2.3,4:3.7}/5\', B\'1010101010101010\')',
                )

                const result = await queryRunner.query('SELECT * FROM "post"')
                await queryRunner.release()

                result.length.should.be.equal(1)
                result[0].embedding.should.equal("[1,2,3,4]")
                result[0].embedding_three_dimensions.should.equal("[4,5,6]")
                result[0].halfvec_embedding.should.equal("[1.5,2.5]")
                result[0].halfvec_four_dimensions.should.equal("[1,2,3,4]")
                result[0].sparse_embedding.should.equal("{1:1.5,4:3.7,5:2.3}/5")
                result[0].bit_vector.should.equal("1010101010101010")
            }),
        ))
})
