import "../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("other issues > bulk save in sqlite", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["sqlite"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should save entities in bulk", () =>
        Promise.all(
            dataSources.map(async function (connection) {
                // insert few posts first
                const posts: Post[] = []
                for (let i = 1; i <= 10000; i++) {
                    posts.push(new Post(i, "Post #" + i))
                }
                // console.log(`saving...`)
                await connection.manager.save(posts)
            }),
        ))
})
