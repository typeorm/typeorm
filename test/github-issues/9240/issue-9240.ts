import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/post.entity"

describe("github issues > #9240 Add array parameter on groupBy", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                dropSchema: true,
                schemaCreate: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should find entities with multiple groupBy", async () => {
        for (const connection of connections) {
            const posts: Post[] = []
            const count = 20
            for (let i = 0; i < count; i += 1) {
                posts.push(new Post(i, i))
                posts.push(new Post(i, i))
            }

            const postRepo = connection.getRepository(Post)
            await postRepo.save(posts)
            const result = await postRepo
                .createQueryBuilder("post")
                .groupBy(["category1", "category2"])
                .getMany()
            expect(result).to.have.length(count)
            result.map((post) => expect(post).to.be.instanceOf(Post))
        }
    })
})
