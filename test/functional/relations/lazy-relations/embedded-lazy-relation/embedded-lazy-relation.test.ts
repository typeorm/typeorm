import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Profile } from "./entity/Profile"
import sinon from "sinon"
import { Author } from "./entity/Author"

describe("lazy relations in embedded entity", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should not reload relations when calling create() with an entity instance having embedded lazy relation", () =>
        Promise.all(
            connections.map(async (connection) => {
                const profile = new Profile()
                profile.about = "I am John Doe profile"
                await connection.manager.save(profile)

                const post = new Post()
                post.title = "Post with embedded author"
                post.author = new Author()
                post.author.name = "John Doe"
                post.author.profile = Promise.resolve(profile)
                await connection.manager.save(post)

                const loadedPost = await connection.manager.findOne(Post, {
                    where: { title: "Post with embedded author" },
                })

                let queryCount = 0
                const loggerStub = sinon
                    .stub(connection.logger, "logQuery")
                    .callsFake(() => queryCount++)

                try {
                    const createdPost = connection.manager.create(
                        Post,
                        loadedPost!,
                    )

                    // Wait for next tick to ensure no lazy relation queries were fired
                    await new Promise((resolve) => process.nextTick(resolve))

                    queryCount.should.be.equal(0)
                    createdPost.author.name.should.be.equal("John Doe")
                } finally {
                    loggerStub.restore()
                }
            }),
        ))
})
