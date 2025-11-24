import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #438 how can i define unsigned column?", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(connections))

    it("should correctly create and change column with UNSIGNED and ZEROFILL attributes", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const metadata = connection.getMetadata(Post)
                const idColumnMetadata =
                    metadata.findColumnWithPropertyName("id")
                const numColumnMetadata =
                    metadata.findColumnWithPropertyName("num")
                let table = await queryRunner.getTable("post")

                table!.findColumnByName("id")!.unsigned!.should.be.true
                table!.findColumnByName("num")!.zerofill!.should.be.true
                table!.findColumnByName("num")!.unsigned!.should.be.true

                idColumnMetadata!.unsigned = false
                numColumnMetadata!.zerofill = false
                numColumnMetadata!.unsigned = false

                await connection.synchronize()

                table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.unsigned!.should.be.false
                table!.findColumnByName("num")!.zerofill!.should.be.false
                table!.findColumnByName("num")!.unsigned!.should.be.false

                await queryRunner.release()
            }),
        ))
})
