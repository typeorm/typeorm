import "reflect-metadata"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { expect } from "chai"

describe("multi-schema-and-database > custom-junction-schema", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [Post, Category],
            enabledDrivers: ["mssql", "postgres", "sap", "cockroachdb"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly create tables when custom table schema used", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                const postTable = (await queryRunner.getTable("yoman.post"))!
                const categoryTable = (await queryRunner.getTable(
                    "yoman.category",
                ))!
                const junctionMetadata = connection.getManyToManyMetadata(
                    Post,
                    "categories",
                )!
                const junctionTable = (await queryRunner.getTable(
                    "yoman." + junctionMetadata.tableName,
                ))!

                expect(postTable.name).to.be.equal("yoman.post")
                expect(categoryTable.name).to.be.equal("yoman.category")
                expect(junctionTable.name).to.be.equal(
                    "yoman." + junctionMetadata.tableName,
                )
            }),
        ))
})
