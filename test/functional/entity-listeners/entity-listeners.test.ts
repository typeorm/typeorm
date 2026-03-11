import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("entity-listeners", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            dropSchema: true,
            schemaCreate: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("beforeUpdate", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.title = "post title"
                post.text = "post text"
                await dataSource.manager.save(post)

                let loadedPost = await dataSource
                    .getRepository(Post)
                    .findOneBy({ id: post.id })
                loadedPost!.title = "post title   "
                await dataSource.manager.save(loadedPost)

                loadedPost = await dataSource
                    .getRepository(Post)
                    .findOneBy({ id: post.id })
                loadedPost!.title.should.be.equal("post title")
            }),
        ))
})
