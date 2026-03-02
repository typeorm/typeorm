import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("github issues > #463 saving empty string array", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not return array with single empty string if empty array was saved", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const post = new Post()
                post.names = []
                await connection.getRepository(Post).save(post)
                const loadedPost = await connection
                    .getRepository(Post)
                    .findOneBy({ identifier: 1 })
                loadedPost!.names.length.should.be.eql(0)
            }),
        ))
})
