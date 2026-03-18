import "reflect-metadata"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("mongodb > indices", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["mongodb"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should insert entity with indices correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)

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
