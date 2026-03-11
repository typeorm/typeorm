import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("repository > clear method", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should remove everything", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // save dummy data
                for (let i = 0; i < 100; i++) {
                    const post = new Post()
                    post.id = i
                    post.title = "post #" + i
                    await dataSource.manager.save(post)
                }

                // check if they all are saved
                const loadedPosts = await dataSource.manager.find(Post)
                loadedPosts.should.be.instanceOf(Array)
                loadedPosts.length.should.be.equal(100)

                await dataSource.getRepository(Post).clear()

                // check find method
                const loadedPostsAfterClear =
                    await dataSource.manager.find(Post)
                loadedPostsAfterClear.should.be.instanceOf(Array)
                loadedPostsAfterClear.length.should.be.equal(0)
            }),
        ))

    it("called from entity managed should remove everything as well", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // save dummy data
                for (let i = 0; i < 100; i++) {
                    const post = new Post()
                    post.id = i
                    post.title = "post #" + i
                    await dataSource.manager.save(post)
                }

                // check if they all are saved
                const loadedPosts = await dataSource.manager.find(Post)
                loadedPosts.should.be.instanceOf(Array)
                loadedPosts.length.should.be.equal(100)

                await dataSource.manager.clear(Post)

                // check find method
                const loadedPostsAfterClear =
                    await dataSource.manager.find(Post)
                loadedPostsAfterClear.should.be.instanceOf(Array)
                loadedPostsAfterClear.length.should.be.equal(0)
            }),
        ))
})
