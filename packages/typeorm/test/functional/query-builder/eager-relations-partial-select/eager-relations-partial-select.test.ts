import "../../../utils/test-setup"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Author } from "./entity/Author"
import { Post } from "./entity/Post"
import { Profile } from "./entity/Profile"

// https://github.com/typeorm/typeorm/issues/13006
describe("query builder > eager relations with a partial relation select", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const findOptions = {
        relations: { author: true },
        select: { id: true, title: true, author: { id: true, name: true } },
        order: { id: "ASC" },
        take: 10,
    } as const

    it("should select each column of the relation once", () => {
        for (const dataSource of dataSources) {
            const query = dataSource
                .getRepository(Post)
                .createQueryBuilder("post")
                .setFindOptions(findOptions)
                .getQuery()

            const selectedNames = query
                .slice(0, query.indexOf(" FROM "))
                .match(/AS [`"]?\w+[`"]?/g)!
            expect(selectedNames).to.have.lengthOf(new Set(selectedNames).size)
        }
    })

    it("should load paginated results with eager children of the selected relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const profile = await dataSource
                    .getRepository(Profile)
                    .save({ bio: "writes a lot" })
                const author = await dataSource.getRepository(Author).save({
                    name: "Alice",
                    email: "alice@example.com",
                    profile,
                })
                await dataSource.getRepository(Post).save([
                    { title: "first", author },
                    { title: "second", author },
                ])

                const posts = await dataSource
                    .getRepository(Post)
                    .find(findOptions)

                expect(posts.map((post) => post.title)).to.eql([
                    "first",
                    "second",
                ])
                for (const post of posts) {
                    expect(post.author.id).to.equal(author.id)
                    expect(post.author.name).to.equal("Alice")
                    expect(post.author.email).to.equal(undefined)
                    expect(post.author.profile.bio).to.equal("writes a lot")
                }
            }),
        ))
})
