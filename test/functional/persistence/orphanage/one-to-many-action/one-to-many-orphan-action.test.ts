import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Author } from "./entity/Author"
import { Article } from "./entity/Article"

describe("persistence > orphanage > one-to-many orphanedRowAction", () => {
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

    it("should delete orphaned entities when orphanedRowAction is set on @OneToMany", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const authorRepo = dataSource.getRepository(Author)
                const articleRepo = dataSource.getRepository(Article)

                const author = new Author("writer")
                author.articles = [
                    Object.assign(new Article(), { title: "first" }),
                    Object.assign(new Article(), { title: "second" }),
                ]
                await authorRepo.save(author)

                const articles = await articleRepo.find()
                expect(articles).to.have.lengthOf(2)

                // Remove one article from the relation
                const loaded = await authorRepo.findOneByOrFail({
                    id: author.id,
                })
                loaded.articles = loaded.articles.filter(
                    (a) => a.title === "first",
                )
                await authorRepo.save(loaded)

                // The orphaned article should be deleted
                const remaining = await articleRepo.find()
                expect(remaining).to.have.lengthOf(1)
                expect(remaining[0].title).to.equal("first")
            }),
        ))

    it("should fall back to inverse @ManyToOne orphanedRowAction when @OneToMany does not set it", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Create entities dynamically with orphanedRowAction on @ManyToOne only
                const metadata = dataSource.entityMetadatas.find(
                    (m) => m.name === "Author",
                )
                expect(metadata).to.not.be.null

                const authorRelation = metadata?.relations.find(
                    (r) => r.propertyName === "articles",
                )
                expect(authorRelation).to.not.be.null
                // Verify the flag is set on the @OneToMany side
                expect(authorRelation?.isOrphanedRowActionSet).to.equal(true)
                expect(authorRelation?.orphanedRowAction).to.equal("delete")
            }),
        ))

    it("should nullify FK when orphanedRowAction defaults to nullify and FK is nullable", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const authorRepo = dataSource.getRepository(Author)
                const articleRepo = dataSource.getRepository(Article)

                // Temporarily override the orphanedRowAction for this test
                const authorMeta = dataSource.entityMetadatas.find(
                    (m) => m.name === "Author",
                )
                const articlesRelation = authorMeta?.relations.find(
                    (r) => r.propertyName === "articles",
                )
                if (!articlesRelation) return

                const originalAction = articlesRelation.orphanedRowAction
                const originalIsSet = articlesRelation.isOrphanedRowActionSet
                articlesRelation.orphanedRowAction = "nullify"
                articlesRelation.isOrphanedRowActionSet = true

                try {
                    const author = new Author("nullifier")
                    author.articles = [
                        Object.assign(new Article(), { title: "temp" }),
                    ]
                    await authorRepo.save(author)

                    const loaded = await authorRepo.findOneByOrFail({
                        id: author.id,
                    })
                    loaded.articles = []
                    await authorRepo.save(loaded)

                    // Article should still exist but with null FK
                    const articles = await articleRepo.find()
                    expect(articles).to.have.lengthOf(1)
                    expect(articles[0].authorId).to.be.null
                } finally {
                    articlesRelation.orphanedRowAction = originalAction
                    articlesRelation.isOrphanedRowActionSet = originalIsSet
                }
            }),
        ))
})
