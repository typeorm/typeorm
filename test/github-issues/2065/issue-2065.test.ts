import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("github issues > #2065 TypeError: Cannot convert object to primitive value", () => {
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

    it("should save an entity created with Object.create(null)", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const post = Object.create(null) as Post
                post.id = 1
                post.title = "Hello Post"
                await connection.manager.save(Post, post)
            }),
        ))
})
