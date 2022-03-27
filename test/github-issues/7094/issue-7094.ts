import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src"
import { Post } from "./entity/Post"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("github issues > #7094 InsertResult return the same primary key", () => {
    let connections: DataSource[]

    const postsID = [1, 2, 3]
    const posts: Post[] = [
        {
            id: postsID[2],
            title: "Post 3",
        },
        {
            id: postsID[1],
            title: "Post 2",
        },
        {
            id: postsID[0],
            title: "Post 1",
        },
    ]

    before(async () => {
        connections = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["mysql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should get original insert ids for multiple entities inserted", async () =>
        await Promise.all(
            connections.map(async (connection) => {
                await connection.getRepository(Post).insert(posts)

                expect(posts[0].id).to.equal(postsID[0])
                expect(posts[1].id).to.equal(postsID[1])
                expect(posts[2].id).to.equal(postsID[2])
            }),
        ))
})
