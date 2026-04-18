import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { Author } from "./entity/Author"
import { Article } from "./entity/Article"

describe("persistence > orphanage > delete > one-to-many", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function seedAuthor(dataSource: DataSource) {
        const authorRepo = dataSource.getRepository(Author)
        const author = new Author("writer")
        author.articles = [
            Object.assign(new Article(), { title: "first" }),
            Object.assign(new Article(), { title: "second" }),
        ]
        await authorRepo.save(author)
        return author
    }

    it("should not touch children when relation is not loaded", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const authorRepo = dataSource.getRepository(Author)
                const articleRepo = dataSource.getRepository(Article)

                const author = await seedAuthor(dataSource)

                // Load parent WITHOUT relations
                const loaded = await authorRepo.findOneByOrFail({
                    id: author.id,
                })
                expect(loaded.articles).to.be.undefined

                loaded.name = "updated"
                await authorRepo.save(loaded)

                // Children should be untouched
                expect(await articleRepo.count()).to.equal(2)
            }),
        ))

    it("should not touch children when relation is loaded but not modified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const authorRepo = dataSource.getRepository(Author)
                const articleRepo = dataSource.getRepository(Article)

                const author = await seedAuthor(dataSource)

                // Load parent WITH relations
                const loaded = await authorRepo.findOneOrFail({
                    where: { id: author.id },
                    relations: { articles: true },
                })
                expect(loaded.articles).to.have.lengthOf(2)

                // Save without modification
                loaded.name = "updated"
                await authorRepo.save(loaded)

                // Children should be untouched
                expect(await articleRepo.count()).to.equal(2)
            }),
        ))

    it("should delete orphaned children when relation is loaded and modified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const authorRepo = dataSource.getRepository(Author)
                const articleRepo = dataSource.getRepository(Article)

                const author = await seedAuthor(dataSource)

                // Load parent WITH relations, then remove one child
                const loaded = await authorRepo.findOneOrFail({
                    where: { id: author.id },
                    relations: { articles: true },
                })
                loaded.articles = loaded.articles.filter(
                    (a) => a.title === "first",
                )
                await authorRepo.save(loaded)

                // Orphaned child should be deleted
                const remaining = await articleRepo.find()
                expect(remaining).to.have.lengthOf(1)
                expect(remaining[0].title).to.equal("first")
            }),
        ))
})
