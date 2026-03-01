import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("github issues > #433 default value (json) is not getting set in postgreSQL", () => {
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

    it("should successfully set default value in to JSON type column", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const post = new Post()
                post.id = 1
                await connection.getRepository(Post).save(post)
                const loadedPost = (await connection
                    .getRepository(Post)
                    .findOneBy({ id: 1 }))!
                loadedPost.json.should.be.eql({ hello: "world" })
            }),
        ))
})
