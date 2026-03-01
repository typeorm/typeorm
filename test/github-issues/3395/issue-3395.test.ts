import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("github issues > #3395 Transform.from does nothing when column is NULL", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Post],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should run transform from if column is null", () =>
        Promise.all(
            dataSources.map(async function (connection) {
                const post = new Post()
                post.id = 1
                await connection.getRepository(Post).save(post)

                const loadedPost = await connection
                    .getRepository(Post)
                    .findOneById(1)

                loadedPost!.text!.should.be.eq("This is null")
            }),
        ))
})
