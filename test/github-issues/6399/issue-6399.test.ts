import type { DataSource } from "../../../src"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post, TargetPost } from "./entity/Post"
import { Comment } from "./entity/Comment"

describe("github issues > #6399 Process extraAppendedAndWhereCondition for inherited entity", () => {
    let dataSources: DataSource[]

    before(async () => {
        return (dataSources = await createTestingConnections({
            entities: [Post, TargetPost, Comment],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["mysql"],
        }))
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("Query with join and limit for inhered entity", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const targetPostRepo = connection.getRepository(TargetPost)

                const posts: TargetPost[] = [
                    {
                        id: 1,
                        title: "Post 1",
                        postType: "TargetPost",
                    },
                    { id: 2, title: "Post 2", postType: "TargetPost" },
                    {
                        id: 3,
                        title: "Post 3",
                        postType: "TargetPost",
                    },
                ]

                await targetPostRepo.save(posts)

                const result = await targetPostRepo
                    .createQueryBuilder("targetPosts")
                    .leftJoinAndSelect("targetPosts.comments", "comments")
                    .take(2)
                    .getMany()

                expect(result.length).eq(2)
            }),
        ))
})
