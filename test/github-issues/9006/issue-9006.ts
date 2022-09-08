import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { Post } from "./entity/post.entity"
import { Comment } from "./entity/comment.entity"
import { expect } from "chai"

describe("github issues > #9006 Eager relations do not respect relationLoadStrategy", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should load eager relation in separate query", async () => {
        for (const dataSource of dataSources) {
            const postRepository = await dataSource.getRepository(Post)
            const post = new Post()
            post.comments = [new Comment()]

            await postRepository.save(post)

            const queryBuilder = postRepository
                .createQueryBuilder()
                .setFindOptions({ relationLoadStrategy: "query" })

            const query = queryBuilder.getSql()

            const loadedPost = await queryBuilder.getMany()

            expect(query).to.not.contain("LEFT JOIN")
            expect(loadedPost).to.deep.equal([{ id: 1, comments: [{ id: 1 }] }])
        }
    })
})
