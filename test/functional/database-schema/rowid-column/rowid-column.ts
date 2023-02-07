import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"

describe("database-schema > rowid-column", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["cockroachdb"],
                dropSchema: true,
                schemaCreate: true,
            })),
    )
    after(() => closeTestingConnections(connections))

    it("should create `rowid` generated column", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("person")
                await queryRunner.release()

                table!.findColumnByName("id")!.type.should.be.equal("int8")
                table!.findColumnByName("id")!.isGenerated.should.be.equal(true)
                table!
                    .findColumnByName("id")!
                    .generationStrategy!.should.be.equal("rowid")

                table!.findColumnByName("id2")!.type.should.be.equal("int8")
                table!
                    .findColumnByName("id2")!
                    .isGenerated.should.be.equal(true)
                table!
                    .findColumnByName("id2")!
                    .generationStrategy!.should.be.equal("rowid")

                table!.findColumnByName("id3")!.type.should.be.equal("int8")
                table!
                    .findColumnByName("id3")!
                    .isGenerated.should.be.equal(true)
                table!
                    .findColumnByName("id3")!
                    .generationStrategy!.should.be.equal("rowid")

                table!.findColumnByName("id4")!.type.should.be.equal("int8")
                table!
                    .findColumnByName("id4")!
                    .isGenerated.should.be.equal(true)
                table!
                    .findColumnByName("id4")!
                    .generationStrategy!.should.be.equal("rowid")
            }),
        ))
})
