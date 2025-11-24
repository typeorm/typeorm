import "reflect-metadata"
import { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("mongodb > indices", () => {
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

    it("should insert entity with indices correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // save a post
                const post = new Post()
                post.title = "Post"
                post.name = "About Post"
                await postRepository.save(post)

                // check saved post
                const loadedPost = await postRepository.findOneBy({
                    title: "Post",
                })

                expect(loadedPost).to.be.not.empty
            }),
        ))
})
