import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { MoreThan } from "../../../../src"

describe("repository > update methods", function () {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("mutate using update method should update successfully", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // save some new posts
                const newPost1 = postRepository.create()
                newPost1.title = "Super post #1"
                const newPost2 = postRepository.create()
                newPost2.title = "Super post #2"
                const newPost3 = postRepository.create()
                newPost3.title = "Super post #3"
                const newPost4 = postRepository.create()
                newPost4.title = "Super post #4"

                await postRepository.save(newPost1)
                await postRepository.save(newPost2)
                await postRepository.save(newPost3)
                await postRepository.save(newPost4)

                // update one
                await postRepository.update(1, { title: "Super duper post #1" })

                // load to check
                const loadedPosts = await postRepository.find()

                // assert
                expect(loadedPosts.length).to.equal(4)
                expect(
                    loadedPosts.filter((p) => p.title === "Super duper post #1")
                        .length,
                ).to.equal(1)
            }),
        ))

    it("mutate multiple rows using update method should update successfully", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // save some new posts
                const newPost1 = postRepository.create()
                newPost1.title = "Super post #1"
                const newPost2 = postRepository.create()
                newPost2.title = "Super post #2"
                const newPost3 = postRepository.create()
                newPost3.title = "Super post #3"
                const newPost4 = postRepository.create()
                newPost4.title = "Super post #4"

                await postRepository.save(newPost1)
                await postRepository.save(newPost2)
                await postRepository.save(newPost3)
                await postRepository.save(newPost4)

                // update multiple
                await postRepository.update([1, 2], {
                    title: "Updated post title",
                })

                // load to check
                const loadedPosts = await postRepository.find()

                // assert
                expect(loadedPosts.length).to.equal(4)
                expect(
                    loadedPosts.filter((p) => p.title === "Updated post title")
                        .length,
                ).to.equal(2)
            }),
        ))

    it("mutate multiple rows using update method with partial criteria should update successfully", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // save some new posts
                const newPost1 = postRepository.create()
                newPost1.title = "Super post #1"
                const newPost2 = postRepository.create()
                newPost2.title = "Super post #2"
                const newPost3 = postRepository.create()
                newPost3.title = "Super post #3"
                const newPost4 = postRepository.create()
                newPost4.title = "Super post #4"

                await postRepository.save(newPost1)
                await postRepository.save(newPost2)
                await postRepository.save(newPost3)
                await postRepository.save(newPost4)

                // update multiple
                await postRepository.update(
                    { id: MoreThan(2) },
                    { title: "Updated post title" },
                )

                // load to check
                const loadedPosts = await postRepository.find()

                // assert
                expect(loadedPosts.length).to.equal(4)
                expect(
                    loadedPosts.filter((p) => p.title === "Updated post title")
                        .length,
                ).to.equal(2)
            }),
        ))

    it("mutates all rows using updateAll method", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // save some new posts
                const newPost1 = postRepository.create()
                newPost1.title = "Super post #1"
                const newPost2 = postRepository.create()
                newPost2.title = "Super post #2"
                const newPost3 = postRepository.create()
                newPost3.title = "Super post #3"
                const newPost4 = postRepository.create()
                newPost4.title = "Super post #4"

                await postRepository.save(newPost1)
                await postRepository.save(newPost2)
                await postRepository.save(newPost3)
                await postRepository.save(newPost4)

                // update all
                await postRepository.updateAll({ title: "Updated post title" })

                // load to check
                const loadedPosts = await postRepository.find()

                // assert
                expect(loadedPosts.length).to.equal(4)
                expect(
                    loadedPosts.filter((p) => p.title === "Updated post title")
                        .length,
                ).to.equal(4)
            }),
        ))
})
