import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("other issues > double inheritance produces multiple duplicated columns", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not produce duplicate columns", () =>
        Promise.all(
            dataSources.map(async function (connection) {
                // insert a post
                const post = new Post()
                post.title = "hello"
                await connection.manager.save(post)

                // check if it was inserted correctly
                const loadedPost = await connection.manager.findOneBy(Post, {
                    id: post.id,
                })
                expect(loadedPost).not.to.be.null
                loadedPost!.title.should.be.equal("hello")
            }),
        ))
})
