import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("query builder > convert raw results to entity", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Post],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should return null value in entity property when record column is null", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const post = new Post()
                post.id = 1

                await postRepository.save(post)

                const loadedPost = await postRepository.findOneBy({ id: 1 })
                if (loadedPost) {
                    expect(loadedPost.isNew).to.be.equal(null)
                }
            }),
        ))

    it("should return true in entity property when record column is true", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const post = new Post()
                post.id = 1
                post.isNew = true

                await postRepository.save(post)

                const loadedPost = await postRepository.findOneBy({ id: 1 })
                if (loadedPost) {
                    expect(loadedPost.isNew).to.be.equal(true)
                }
            }),
        ))

    it("should return false in entity property when record column is false", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const post = new Post()
                post.id = 1
                post.isNew = false

                await postRepository.save(post)

                const loadedPost = await postRepository.findOneBy({ id: 1 })
                if (loadedPost) {
                    expect(loadedPost.isNew).to.be.equal(false)
                }
            }),
        ))
})
