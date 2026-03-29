import "reflect-metadata"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

describe("database schema > getTable > oracle", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["oracle"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("getTable should work with lowercase table names", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                
                // Test that getTable works with lowercase table name
                const table = await queryRunner.getTable("post")
                
                // Verify table was found
                table!.should.not.be.undefined
                table!.name.toLowerCase().should.equal("post")
                
                await queryRunner.release()
            }),
        ))

    it("getTable should work with uppercase table names", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                
                // Test that getTable works with uppercase table name
                const table = await queryRunner.getTable("POST")
                
                // Verify table was found
                table!.should.not.be.undefined
                table!.name.toLowerCase().should.equal("post")
                
                await queryRunner.release()
            }),
        ))

    it("getTable should work with mixed-case table names", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                
                // Test that getTable works with mixed-case table name
                const table = await queryRunner.getTable("Post")
                
                // Verify table was found
                table!.should.not.be.undefined
                table!.name.toLowerCase().should.equal("post")
                
                await queryRunner.release()
            }),
        ))

    it("getTables should work with multiple table names", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                
                // Test that getTables works with multiple table names
                const tables = await queryRunner.getTables(["post", "POST", "Post"])
                
                // Should find at least one table (they all refer to the same table)
                tables.length.should.be.greaterThan(0)
                
                await queryRunner.release()
            }),
        ))
})
