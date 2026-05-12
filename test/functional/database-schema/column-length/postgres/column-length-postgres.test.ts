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

    it("all types should update their size", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const characterVaryingValue = "a".repeat(50)
                const varcharValue = "b".repeat(50)
                const characterValue = "c".repeat(50)
                const charValue = "d".repeat(50)

                await dataSource.getRepository(Post).save({
                    id: 1,
                    characterVarying: characterVaryingValue,
                    varchar: varcharValue,
                    character: characterValue,
                    char: charValue,
                })

                const metadata = dataSource.getMetadata(Post)
                metadata.findColumnWithPropertyName(
                    "characterVarying",
                )!.length = "100"
                metadata.findColumnWithPropertyName("varchar")!.length = "100"
                metadata.findColumnWithPropertyName("character")!.length = "100"
                metadata.findColumnWithPropertyName("char")!.length = "100"

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                const upQueries = sqlInMemory.upQueries.map(
                    (query) => query.query,
                )

                expect(upQueries).to.include(
                    'ALTER TABLE "post" ALTER COLUMN "characterVarying" TYPE character varying(100)',
                )
                expect(upQueries).to.include(
                    'ALTER TABLE "post" ALTER COLUMN "varchar" TYPE character varying(100)',
                )
                expect(upQueries).to.include(
                    'ALTER TABLE "post" ALTER COLUMN "character" TYPE character(100)',
                )
                expect(upQueries).to.include(
                    'ALTER TABLE "post" ALTER COLUMN "char" TYPE character(100)',
                )
                expect(upQueries.some((query) => query.includes("DROP COLUMN")))
                    .to.be.false
                expect(
                    upQueries.some((query) =>
                        query.includes('ADD "characterVarying"'),
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
                    .findOneByOrFail({ id: 1 })
                expect(post.characterVarying).to.be.equal(characterVaryingValue)
                expect(post.varchar).to.be.equal(varcharValue)
                expect(post.character).to.be.equal(characterValue)
                expect(post.char).to.be.equal(charValue)
            }),
        ))
})
