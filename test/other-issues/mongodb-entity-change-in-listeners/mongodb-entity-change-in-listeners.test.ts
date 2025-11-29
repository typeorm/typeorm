import "../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("other issues > mongodb entity change in listeners should affect persistence", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["mongodb"],
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("if entity was changed in the listener, changed property should be updated in the db", () =>
        Promise.all(
            connections.map(async function (connection) {
                const postRepository = connection.getMongoRepository(Post)

                // insert a post
                const post = new Post()
                post.title = "hello"
                await postRepository.save(post)

                // check if it was inserted correctly
                const loadedPost = await postRepository.findOneBy({
                    _id: post.id,
                })
                expect(loadedPost).not.to.be.null
                loadedPost!.title.should.be.equal("hello")

                // now update some property and let update listener trigger
                loadedPost!.active = true
                await postRepository.save(loadedPost!)

                // check if update listener was triggered and entity was really updated by the changes in the listener
                const loadedUpdatedPost = await postRepository.findOneBy({
                    _id: post.id,
                })

                expect(loadedUpdatedPost).not.to.be.null
                loadedUpdatedPost!.title.should.be.equal("hello!")
                await connection.manager.save(loadedPost!)
            }),
        ))

    it("if entity was loaded in the listener, loaded property should be changed", () =>
        Promise.all(
            connections.map(async function (connection) {
                const postRepository = connection.getMongoRepository(Post)

                // insert a post
                const post = new Post()
                post.title = "hello"
                await postRepository.save(post)

                const loadedPost = await postRepository.findOneByOrFail({
                    _id: post.id,
                })

                expect(loadedPost).not.to.be.null
                loadedPost!.loaded.should.be.equal(true)
                await postRepository.save(loadedPost!)
            }),
        ))
})
