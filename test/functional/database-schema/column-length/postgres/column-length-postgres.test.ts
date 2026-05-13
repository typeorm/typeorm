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

    // Regression test for #3357: length changes should not drop and recreate
    // Postgres columns, because that loses existing data.
    it("all types should update their size without dropping column data", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.getRepository(Post).save({
                    id: 1,
                    characterVarying: "character varying value",
                    varchar: "varchar value",
                    character: "character value",
                    char: "char value",
                })

                const metadata = dataSource.getMetadata(Post)
                metadata.findColumnWithPropertyName(
                    "characterVarying",
                )!.length = "100"
                metadata.findColumnWithPropertyName("varchar")!.length = "100"
                metadata.findColumnWithPropertyName("character")!.length = "100"
                metadata.findColumnWithPropertyName("char")!.length = "100"

                const sqlInMemory =
                    await dataSource.driver.createSchemaBuilder().log()
                const upQueries = sqlInMemory.upQueries.map(
                    (query) => query.query,
                )

                expect(upQueries).to.include(
                    `ALTER TABLE "post" ALTER COLUMN "varchar" TYPE character varying(100)`,
                )
                expect(
                    upQueries.some((query) =>
                        query.includes(`DROP COLUMN "varchar"`),
                    ),
                ).to.be.false
                expect(
                    upQueries.some((query) =>
                        query.includes(`ADD "varchar"`),
                    ),
                ).to.be.false

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

                const post = await dataSource
                    .getRepository(Post)
                    .findOneBy({ id: 1 })

                expect(post!.characterVarying).to.be.equal(
                    "character varying value",
                )
                expect(post!.varchar).to.be.equal("varchar value")
            }),
        ))
})
