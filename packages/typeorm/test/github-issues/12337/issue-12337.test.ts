import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Author } from "./entity/Author"
import { Post } from "./entity/Post"

describe("github issues > #12337 single @JoinColumn should properly extract foreign key values", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Author, Post],
                enabledDrivers: ["better-sqlite3", "sqlite"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should preserve foreign key value when referenced entity id is 0", () =>
        Promise.all(
            connections.map(async (connection) => {
                const author = new Author()
                author.id = 0
                author.name = "Zero Author"
                await connection.manager.save(author)

                const post = new Post()
                post.title = "Post with author 0"
                post.author = author
                await connection.manager.save(post)

                const loadedPost = await connection.manager.findOneBy(Post, {
                    id: post.id,
                })
                expect(loadedPost).not.to.be.null
                expect(loadedPost!.authorId).to.equal(0)
            }),
        ))
})
