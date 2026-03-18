import "reflect-metadata"
import { expect } from "chai"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

describe("database schema > column length > mssql", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["mssql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("all types should create with correct size", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(table!.findColumnByName("char")!.length).to.be.equal(
                    "50",
                )
                expect(table!.findColumnByName("varchar")!.length).to.be.equal(
                    "50",
                )
                expect(table!.findColumnByName("nchar")!.length).to.be.equal(
                    "50",
                )
                expect(table!.findColumnByName("nvarchar")!.length).to.be.equal(
                    "50",
                )
                expect(table!.findColumnByName("binary")!.length).to.be.equal(
                    "50",
                )
                expect(
                    table!.findColumnByName("varbinary")!.length,
                ).to.be.equal("50")
            }),
        ))

    it("all types should update their size", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const metadata = dataSource.getMetadata(Post)
                metadata.findColumnWithPropertyName("char")!.length = "100"
                metadata.findColumnWithPropertyName("varchar")!.length = "100"
                metadata.findColumnWithPropertyName("nchar")!.length = "100"
                metadata.findColumnWithPropertyName("nvarchar")!.length = "100"
                metadata.findColumnWithPropertyName("binary")!.length = "100"
                metadata.findColumnWithPropertyName("varbinary")!.length = "100"

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(table!.findColumnByName("char")!.length).to.be.equal(
                    "100",
                )
                expect(table!.findColumnByName("varchar")!.length).to.be.equal(
                    "100",
                )
                expect(table!.findColumnByName("nchar")!.length).to.be.equal(
                    "100",
                )
                expect(table!.findColumnByName("nvarchar")!.length).to.be.equal(
                    "100",
                )
                expect(table!.findColumnByName("binary")!.length).to.be.equal(
                    "100",
                )
                expect(
                    table!.findColumnByName("varbinary")!.length,
                ).to.be.equal("100")
            }),
        ))

    it("all relevant types should update their size to max", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const metadata = dataSource.getMetadata(Post)
                metadata.findColumnWithPropertyName("varchar")!.length = "MAX"
                metadata.findColumnWithPropertyName("nvarchar")!.length = "MAX"
                metadata.findColumnWithPropertyName("varbinary")!.length = "MAX"

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(table!.findColumnByName("varchar")!.length).to.be.equal(
                    "MAX",
                )
                expect(table!.findColumnByName("nvarchar")!.length).to.be.equal(
                    "MAX",
                )
                expect(
                    table!.findColumnByName("varbinary")!.length,
                ).to.be.equal("MAX")
            }),
        ))
})
