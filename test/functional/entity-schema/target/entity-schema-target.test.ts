import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src"
import { PostEntity } from "./entity/PostEntity"
import { Post } from "./model/Post"

describe("entity schemas > target option", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [PostEntity],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create instance of the target", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const post = postRepository.create({
                    title: "First Post",
                    text: "About first post",
                })
                post.should.be.instanceof(Post)
            }),
        ))

    it("should find instances of the target", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const post = new Post()
                post.title = "First Post"
                post.text = "About first post"
                await postRepository.save(post)

                const loadedPost = await postRepository.findOneBy({
                    title: "First Post",
                })
                loadedPost!.should.be.instanceof(Post)
            }),
        ))
})
