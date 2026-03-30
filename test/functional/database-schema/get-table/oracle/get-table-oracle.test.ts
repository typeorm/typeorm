import "reflect-metadata"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

// GitHub issue #12230
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
                try {
                    const table = await queryRunner.getTable("post")
                    table!.should.not.be.undefined
                    table!.name.toLowerCase().should.equal("post")
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("getTable should work with uppercase table names", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    const table = await queryRunner.getTable("POST")
                    table!.should.not.be.undefined
                    table!.name.toLowerCase().should.equal("post")
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("getTable should work with mixed-case table names", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    const table = await queryRunner.getTable("Post")
                    table!.should.not.be.undefined
                    table!.name.toLowerCase().should.equal("post")
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("getTables should work with multiple table names", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    const tables = await queryRunner.getTables(["post", "POST", "Post"])
                    tables.length.should.be.greaterThan(0)
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
