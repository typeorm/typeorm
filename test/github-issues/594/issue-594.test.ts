import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("github issues > #594 WhereInIds no longer works in the latest version.", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should load entities by given simple post ids (non mixed)", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                for (let i = 0; i < 10; i++) {
                    const post = new Post()
                    post.modelId = i
                    await connection.manager.save(post)
                }

                const loadedPosts = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .whereInIds([1, 2, 5])
                    .getMany()

                loadedPosts.length.should.be.equal(3)
                loadedPosts[0]!.postId.should.be.equal(1)
                loadedPosts[1]!.postId.should.be.equal(2)
                loadedPosts[2]!.postId.should.be.equal(5)
            }),
        ))
})
