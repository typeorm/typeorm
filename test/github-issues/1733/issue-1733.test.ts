import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #1733 Postgresql driver does not detect/support varying without length specified", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should correctly synchronize schema when varchar column length is not specified", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                let table = await queryRunner.getTable("post")

                table!.findColumnByName("name")!.length.should.be.empty
                table!.findColumnByName("name2")!.length.should.be.equal("255")

                const postMetadata = connection.getMetadata(Post)
                const column1 = postMetadata.findColumnWithPropertyName("name")!
                const column2 =
                    postMetadata.findColumnWithPropertyName("name2")!
                column1.length = "500"
                column2.length = ""

                await connection.getRepository(Post).save({
                    name: "keeps existing value",
                    name2: "keeps existing value too",
                })

                await connection.synchronize()

                table = await queryRunner.getTable("post")
                table!.findColumnByName("name")!.length.should.be.equal("500")
                table!.findColumnByName("name2")!.length.should.be.empty
                const savedPost = await connection
                    .getRepository(Post)
                    .findOneByOrFail({ name: "keeps existing value" })
                savedPost.name2.should.be.equal("keeps existing value too")

                column1.length = ""
                column2.length = "255"

                await connection.synchronize()

                table = await queryRunner.getTable("post")
                table!.findColumnByName("name")!.length.should.be.empty
                table!.findColumnByName("name2")!.length.should.be.equal("255")

                await queryRunner.release()
            }),
        ))
})
