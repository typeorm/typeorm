import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"

// Issue #3357 — changes that can be applied with ALTER COLUMN TYPE must
// preserve existing row data instead of dropping and re-adding the column.
describe("schema builder > column type > alter column preserves data", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should preserve data when widening varchar length", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const metadata = connection.getMetadata(Post)
                const titleColumn = metadata.columns.find(
                    (c) => c.propertyName === "title",
                )
                if (!titleColumn) throw new Error("title column not found")
                const originalLength = titleColumn.length

                const repo = connection.getRepository(Post)
                const saved = await repo.save(
                    repo.create({ title: "hello world" }),
                )

                titleColumn.length = "100"
                try {
                    await connection.synchronize()

                    const loaded = await repo.findOneByOrFail({ id: saved.id })
                    expect(loaded.title).to.equal("hello world")

                    const queryRunner = connection.createQueryRunner()
                    try {
                        const table = await queryRunner.getTable("post")
                        const column = table?.findColumnByName("title")
                        expect(column?.length).to.equal("100")
                    } finally {
                        await queryRunner.release()
                    }
                } finally {
                    titleColumn.length = originalLength
                }
            }),
        ))

    it("should preserve data when changing varchar to text", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const metadata = connection.getMetadata(Post)
                const excerptColumn = metadata.columns.find(
                    (c) => c.propertyName === "excerpt",
                )
                if (!excerptColumn) throw new Error("excerpt column not found")
                const originalType = excerptColumn.type
                const originalLength = excerptColumn.length

                const repo = connection.getRepository(Post)
                const saved = await repo.save(
                    repo.create({ excerpt: "quick brown fox" }),
                )

                excerptColumn.type = "text"
                excerptColumn.length = ""
                try {
                    await connection.synchronize()

                    const loaded = await repo.findOneByOrFail({ id: saved.id })
                    expect(loaded.excerpt).to.equal("quick brown fox")

                    const queryRunner = connection.createQueryRunner()
                    try {
                        const table = await queryRunner.getTable("post")
                        const column = table?.findColumnByName("excerpt")
                        expect(column?.type).to.equal("text")
                    } finally {
                        await queryRunner.release()
                    }
                } finally {
                    excerptColumn.type = originalType
                    excerptColumn.length = originalLength
                }
            }),
        ))

    it("should preserve data when widening int to bigint", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const metadata = connection.getMetadata(Post)
                const viewCountColumn = metadata.columns.find(
                    (c) => c.propertyName === "viewCount",
                )
                if (!viewCountColumn)
                    throw new Error("viewCount column not found")
                const originalType = viewCountColumn.type

                const repo = connection.getRepository(Post)
                const saved = await repo.save(repo.create({ viewCount: 42 }))

                viewCountColumn.type = "bigint"
                try {
                    await connection.synchronize()

                    const loaded = await repo.findOneByOrFail({ id: saved.id })
                    expect(String(loaded.viewCount)).to.equal("42")

                    const queryRunner = connection.createQueryRunner()
                    try {
                        const table = await queryRunner.getTable("post")
                        const column = table?.findColumnByName("viewCount")
                        expect(column?.type).to.equal("bigint")
                    } finally {
                        await queryRunner.release()
                    }
                } finally {
                    viewCountColumn.type = originalType
                }
            }),
        ))

    it("should preserve data when changing numeric precision", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const metadata = connection.getMetadata(Post)
                const priceColumn = metadata.columns.find(
                    (c) => c.propertyName === "price",
                )
                if (!priceColumn) throw new Error("price column not found")
                const originalPrecision = priceColumn.precision
                const originalScale = priceColumn.scale

                const repo = connection.getRepository(Post)
                const saved = await repo.save(repo.create({ price: "123.45" }))

                priceColumn.precision = 14
                priceColumn.scale = 4
                try {
                    await connection.synchronize()

                    const loaded = await repo.findOneByOrFail({ id: saved.id })
                    expect(loaded.price).to.equal("123.4500")

                    const queryRunner = connection.createQueryRunner()
                    try {
                        const table = await queryRunner.getTable("post")
                        const column = table?.findColumnByName("price")
                        expect(column?.precision).to.equal(14)
                        expect(column?.scale).to.equal(4)
                    } finally {
                        await queryRunner.release()
                    }
                } finally {
                    priceColumn.precision = originalPrecision
                    priceColumn.scale = originalScale
                }
            }),
        ))
})
