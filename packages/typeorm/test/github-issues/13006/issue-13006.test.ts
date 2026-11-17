import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Profile } from "./entity/Profile"
import { Author } from "./entity/Author"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("github issues > #13006 find() with partial relation select and eager relations", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Profile, Author, Post],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not duplicate selected columns when joined entity has eager relations", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const profile = new Profile()
                profile.bio = "Developer"
                await dataSource.manager.save(profile)

                const author = new Author()
                author.name = "John Doe"
                author.email = "john@example.com"
                author.profile = profile
                await dataSource.manager.save(author)

                const post = new Post()
                post.title = "Hello World"
                post.author = author
                await dataSource.manager.save(post)

                const posts = await dataSource.getRepository(Post).find({
                    relations: { author: true },
                    select: {
                        id: true,
                        title: true,
                        author: { id: true, name: true },
                    },
                    order: { id: "ASC" },
                    take: 10,
                })

                expect(posts).to.have.length(1)
                expect(posts[0].title).to.equal("Hello World")
                expect(posts[0].author.name).to.equal("John Doe")
            }),
        )
    })
})
