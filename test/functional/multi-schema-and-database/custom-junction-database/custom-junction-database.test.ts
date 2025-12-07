import "reflect-metadata"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
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

describe("multi-schema-and-database > custom-junction-database", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [Post, Category],
            enabledDrivers: ["mysql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly create tables when custom table schema used", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                if (connection.driver.options.type === "mssql") {
                    const postTable = await queryRunner.getTable("yoman..post")
                    const categoryTable =
                        await queryRunner.getTable("yoman..category")
                    const junctionMetadata = connection.getManyToManyMetadata(
                        Post,
                        "categories",
                    )!
                    const junctionTable = await queryRunner.getTable(
                        "yoman.." + junctionMetadata.tableName,
                    )
                    expect(postTable).not.to.be.undefined
                    postTable!.name!.should.be.equal("yoman..post")
                    expect(categoryTable).not.to.be.undefined
                    categoryTable!.name!.should.be.equal("yoman..category")
                    expect(junctionTable).not.to.be.undefined
                    junctionTable!.name!.should.be.equal(
                        "yoman.." + junctionMetadata.tableName,
                    )
                } else {
                    // mysql
                    const postTable = await queryRunner.getTable("yoman.post")
                    const categoryTable =
                        await queryRunner.getTable("yoman.category")
                    const junctionMetadata = connection.getManyToManyMetadata(
                        Post,
                        "categories",
                    )!
                    const junctionTable = await queryRunner.getTable(
                        "yoman." + junctionMetadata.tableName,
                    )
                    expect(postTable).not.to.be.undefined
                    postTable!.name!.should.be.equal("yoman.post")
                    expect(categoryTable).not.to.be.undefined
                    categoryTable!.name!.should.be.equal("yoman.category")
                    expect(junctionTable).not.to.be.undefined
                    junctionTable!.name!.should.be.equal(
                        "yoman." + junctionMetadata.tableName,
                    )
                }
                await queryRunner.release()
            }),
        ))
})
