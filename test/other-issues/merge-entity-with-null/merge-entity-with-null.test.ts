import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("other issues > using limit in conjunction with order by", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("clears the title when provided with a null value", () =>
        Promise.all(
            dataSources.map(async function (connection) {
                const post = new Post()
                post.title = "Hello Post"

                connection.manager.merge(Post, post, { title: null })
                await connection.manager.save(post)

                expect(post.title).to.be.null
            }),
        ))
})
