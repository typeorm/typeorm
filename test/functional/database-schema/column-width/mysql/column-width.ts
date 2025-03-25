import "reflect-metadata"
import { expect } from "chai"
import { Post } from "./entity/Post"
import { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

describe("database schema > column width", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["mysql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("all types should be created with correct width", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(table!.findColumnByName("int")!.width).to.be.equal(10)
                expect(table!.findColumnByName("tinyint")!.width).to.be.equal(2)
                expect(table!.findColumnByName("smallint")!.width).to.be.equal(
                    3,
                )
                expect(table!.findColumnByName("mediumint")!.width).to.be.equal(
                    9,
                )
                expect(table!.findColumnByName("bigint")!.width).to.be.equal(10)
            }),
        ))

    it("should update data type display width", () =>
        Promise.all(
            connections.map(async (connection) => {
                const metadata = connection.getMetadata(Post)
                metadata.findColumnWithPropertyName("int")!.width = 5
                metadata.findColumnWithPropertyName("tinyint")!.width = 3
                metadata.findColumnWithPropertyName("smallint")!.width = 4
                metadata.findColumnWithPropertyName("mediumint")!.width = 10
                metadata.findColumnWithPropertyName("bigint")!.width = 11

                await connection.synchronize()

                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(table!.findColumnByName("int")!.width).to.be.equal(5)
                expect(table!.findColumnByName("tinyint")!.width).to.be.equal(3)
                expect(table!.findColumnByName("smallint")!.width).to.be.equal(
                    4,
                )
                expect(table!.findColumnByName("mediumint")!.width).to.be.equal(
                    10,
                )
                expect(table!.findColumnByName("bigint")!.width).to.be.equal(11)
            }),
        ))
})
