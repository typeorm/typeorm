import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("other issues > entity listeners must work in embeddeds as well", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("getters and setters should work correctly", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const post = new Post()
                post.title = "Super title"
                post.text = "About this post"
                await connection.manager.save(post)

                const loadedPost = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .where("post.id = :id", { id: post.id })
                    .getOne()

                expect(loadedPost).not.to.be.null
                expect(loadedPost!.title).not.to.be.undefined
                expect(loadedPost!.text).not.to.be.undefined
                loadedPost!.title.should.be.equal("Super title")
                loadedPost!.text.should.be.equal("About this post")
            }),
        ))
})
