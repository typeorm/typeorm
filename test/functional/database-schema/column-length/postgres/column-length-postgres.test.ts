import "reflect-metadata"
import { expect } from "chai"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

describe("database schema > column length > postgres", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres"],
        })
    })

    it("length-only change should use ALTER COLUMN TYPE without dropping", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                const varcharColumn = table!.findColumnByName("varchar")!

                const resizedColumn = varcharColumn.clone()
                resizedColumn.length =
                    varcharColumn.length === "100" ? "101" : "100"

                queryRunner.enableSqlMemory()
                try {
                    await queryRunner.changeColumn(
                        table!,
                        varcharColumn,
                        resizedColumn,
                    )
                    const memorySql = queryRunner.getMemorySql()
                    const upSql = memorySql.upQueries
                        .map((q) => q.query)
                        .join(";\n")
                    const downSql = memorySql.downQueries
                        .map((q) => q.query)
                        .join(";\n")

                    expect(upSql).to.contain("ALTER COLUMN")
                    expect(upSql).to.contain("TYPE")
                    expect(upSql).to.not.contain("DROP COLUMN")
                    expect(downSql).to.contain("ALTER COLUMN")
                    expect(downSql).to.contain("TYPE")
                } finally {
                    queryRunner.disableSqlMemory()
                    await queryRunner.release()
                }
            }),
        ))

    it("default-only change should not drop and recreate the column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                const varcharColumn = table!.findColumnByName("varchar")!

                const defaultChangedColumn = varcharColumn.clone()
                defaultChangedColumn.default = "'regression-default'"

                queryRunner.enableSqlMemory()
                try {
                    await queryRunner.changeColumn(
                        table!,
                        varcharColumn,
                        defaultChangedColumn,
                    )
                    const memorySql = queryRunner.getMemorySql()
                    const upSql = memorySql.upQueries
                        .map((q) => q.query)
                        .join(";\n")

                    expect(upSql).to.not.contain("DROP COLUMN")
                    expect(upSql).to.contain("SET DEFAULT")
                } finally {
                    queryRunner.disableSqlMemory()
                    await queryRunner.release()
                }
            }),
        ))

    it("combined length and collation change should not strip the length", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                const varcharColumn = table!.findColumnByName("varchar")!

                const changedColumn = varcharColumn.clone()
                changedColumn.length = "100"
                changedColumn.collation = "C"

                queryRunner.enableSqlMemory()
                try {
                    await queryRunner.changeColumn(
                        table!,
                        varcharColumn,
                        changedColumn,
                    )
                    const memorySql = queryRunner.getMemorySql()
                    const upSql = memorySql.upQueries
                        .map((q) => q.query)
                        .join(";\n")

                    // no bare-type collation ALTER that would drop the length
                    expect(upSql).to.not.match(/TYPE character varying COLLATE/)
                    // the requested length must appear in the emitted SQL
                    expect(upSql).to.contain("character varying(100)")
                } finally {
                    queryRunner.disableSqlMemory()
                    await queryRunner.release()
                }
            }),
        ))

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("all types should create with correct size", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(
                    table!.findColumnByName("characterVarying")!.length,
                ).to.be.equal("50")
                expect(table!.findColumnByName("varchar")!.length).to.be.equal(
                    "50",
                )
                expect(
                    table!.findColumnByName("character")!.length,
                ).to.be.equal("50")
                expect(table!.findColumnByName("char")!.length).to.be.equal(
                    "50",
                )
            }),
        ))

    it("all types should update their size", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const metadata = dataSource.getMetadata(Post)
                metadata.findColumnWithPropertyName(
                    "characterVarying",
                )!.length = "100"
                metadata.findColumnWithPropertyName("varchar")!.length = "100"
                metadata.findColumnWithPropertyName("character")!.length = "100"
                metadata.findColumnWithPropertyName("char")!.length = "100"

                await dataSource.synchronize(false)

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(
                    table!.findColumnByName("characterVarying")!.length,
                ).to.be.equal("100")
                expect(table!.findColumnByName("varchar")!.length).to.be.equal(
                    "100",
                )
                expect(
                    table!.findColumnByName("character")!.length,
                ).to.be.equal("100")
                expect(table!.findColumnByName("char")!.length).to.be.equal(
                    "100",
                )
            }),
        ))
})
