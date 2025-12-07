import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import { Post } from "./entity/Post"

describe("github issues > #9518 Can't pass ObjectLiteral in MongoRepository.find where condition due to typings", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post],
                enabledDrivers: ["mongodb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should be able to use ObjectLiteral in find where condition", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getMongoRepository(Post)

                const firstPost = new Post()
                firstPost.title = "Post #1"
                await postRepository.save(firstPost)

                const secondPost = new Post()
                secondPost.title = "Post #2"
                await postRepository.save(secondPost)

                const loadedPosts = await postRepository.find({
                    where: {
                        title: { $in: ["Post #1"] },
                    },
                })

                expect(loadedPosts).to.have.length(1)
                expect(loadedPosts[0].title).to.eql("Post #1")
            }),
        ))
})
