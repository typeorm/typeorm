import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/post.entity"
import { Comment } from "./entity/comment"
import { Value } from "./entity/value"
import { expect } from "chai"

describe("github issues > #9049 mongodb entities with 2 level-nested arrays throws an 'document[embedded.prefix].map is not a function' error", () => {
    let connections: DataSource[]
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mongodb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should save entities properly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post = new Post()
                const comment = new Comment()
                const value = new Value()

                value.description = "description"
                comment.values = [value]
                post.comments = [comment]

                await connection.mongoManager.save(post)

                const postRepo = connection.getRepository(Post)
                const posts = await postRepo.find({})
                posts.forEach((post) => expect(post).to.be.instanceof(Post))
            }),
        ))
})
