import "reflect-metadata"
import { expect } from "chai"
import sinon from "sinon"

import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"

// https://github.com/typeorm/typeorm/issues/12861
describe("relations > lazy relations > rejected load", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["better-sqlite3"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))
    afterEach(() => sinon.restore())

    it("should not leave an unhandled rejection when the caller handles the error", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const category = new Category()
                category.name = "category"
                await dataSource.manager.save(category)

                const post = new Post()
                post.title = "post"
                post.category = Promise.resolve(category)
                await dataSource.manager.save(post)

                const loadedPost = await dataSource.manager.findOneByOrFail(
                    Post,
                    { id: post.id },
                )

                const loadStub = sinon
                    .stub(dataSource.relationLoader, "load")
                    .rejects(new Error("Query read timeout"))

                const unhandledRejections: unknown[] = []
                const onUnhandledRejection = (reason: unknown) =>
                    unhandledRejections.push(reason)
                process.on("unhandledRejection", onUnhandledRejection)
                try {
                    await expect(loadedPost.category).to.be.rejectedWith(
                        "Query read timeout",
                    )
                    await new Promise((resolve) => setImmediate(resolve))
                } finally {
                    process.off("unhandledRejection", onUnhandledRejection)
                }
                expect(unhandledRejections).to.be.empty

                loadStub.restore()
                const loadedCategory = await loadedPost.category
                expect(loadedCategory.id).to.equal(category.id)
            }),
        ))
})
