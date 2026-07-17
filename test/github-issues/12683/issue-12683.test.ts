import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Author } from "./entity/Author"
import { Post } from "./entity/Post"

describe("github issues > #12683 relation hydration silently dropped when entity constructor pre-initializes the relation property", () => {
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

    async function prepareData(dataSource: DataSource) {
        const author = new Author()
        author.name = "George Orwell"
        await dataSource.manager.save(author)

        const post = new Post()
        post.title = "1984"
        post.author = author
        await dataSource.manager.save(post)
    }

    it("should hydrate the requested relation even though the constructor pre-initializes it with an empty instance", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const loadedPost = await dataSource.manager.findOneOrFail(
                    Post,
                    {
                        where: { id: 1 },
                        relations: { author: true },
                    },
                )

                // Before the fix, `author` stayed the empty `new Author()`
                // instance created in the Post constructor: `setEntityValue`
                // saw an existing object-typed value and tried to merge into
                // it, but `OrmUtils.merge` only merges plain objects, so the
                // merge into a class instance is a silent no-op and the
                // freshly hydrated Author columns are discarded.
                expect(loadedPost.author).to.not.be.undefined
                expect(loadedPost.author.id).to.equal(1)
                expect(loadedPost.author.name).to.equal("George Orwell")
            }),
        ))

    it("should not populate the relation when it was not requested", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const loadedPost = await dataSource.manager.findOneOrFail(
                    Post,
                    { where: { id: 1 } },
                )

                // The constructor-created placeholder instance is left
                // untouched when the relation isn't part of the query.
                expect(loadedPost.author).to.be.instanceOf(Author)
                expect(loadedPost.author.id).to.be.undefined
            }),
        ))
})
