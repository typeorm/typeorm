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

    it("should delete the orphaned entity when orphanedRowAction is on @OneToMany", () =>
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

                expect(await articleRepo.count()).to.equal(2)

                const loaded = await authorRepo.findOneByOrFail({
                    id: author.id,
                })
                loaded.articles = loaded.articles.filter(
                    (a) => a.title === "first",
                )
                await authorRepo.save(loaded)

                const remaining = await articleRepo.find()
                expect(remaining).to.have.lengthOf(1)
                expect(remaining[0].title).to.equal("first")
            }),
        ))
})
