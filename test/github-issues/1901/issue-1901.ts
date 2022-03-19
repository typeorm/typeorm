import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("github issues > #1901 The correct way of adding `ON UPDATE CURRENT_TIMESTAMP` clause to timestamp column", () => {
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

    it("should correctly create and change column with ON UPDATE expression", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                let table = await queryRunner.getTable("post")
                table!
                    .findColumnByName("updateAt")!
                    .onUpdate!.should.be.equal("CURRENT_TIMESTAMP(3)")

                const metadata = connection.getMetadata(Post)
                metadata.findColumnWithPropertyName("updateAt")!.onUpdate =
                    undefined
                await connection.synchronize()

                table = await queryRunner.getTable("post")
                expect(table!.findColumnByName("updateAt")!.onUpdate).to.be
                    .undefined
            }),
        ))
})
