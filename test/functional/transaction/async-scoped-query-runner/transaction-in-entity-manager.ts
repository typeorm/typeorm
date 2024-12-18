import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnectionsFactory,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { expect } from "chai"
import { DatabaseType } from "../../../../src"

const connectionsFactory = createTestingConnectionsFactory({
    entities: [__dirname + "/entity/*{.js,.ts}"],
})
const { enabledDrivers } = connectionsFactory
const connectionsMap = new Map<string, DataSource>()

function getDataSourceOrFail(
    driver: DatabaseType,
    connectionsMap: Map<string, DataSource>,
) {
    if (!connectionsMap.has(driver)) {
        throw new Error(`DataSource for ${driver} is not found`)
    }
    return connectionsMap.get(driver) as DataSource
}

before(async () => {
    const connections = await connectionsFactory()
    connections.forEach((connection) =>
        connectionsMap.set(connection.driver.options.type, connection),
    )
})
after(() => closeTestingConnections([...connectionsMap.values()]))
describe("transactionWithContext", () => {
    for (const driver of enabledDrivers) {
        describe(`with entity manager (${driver})`, () => {
            beforeEach(() =>
                reloadTestingDatabases([...connectionsMap.values()]),
            )

            it(`should execute all operations in a single transaction`, async () => {
                const { manager } = getDataSourceOrFail(driver, connectionsMap)
                let postId: number | undefined = undefined,
                    categoryId: number | undefined = undefined

                await manager.transactionWithContext(async () => {
                    const post = new Post()
                    post.title = "Post #1"
                    await manager.save(post)

                    const category = new Category()
                    category.name = "Category #1"
                    await manager.save(category)

                    postId = post.id
                    categoryId = category.id
                })

                const post = await manager.findOne(Post, {
                    where: { title: "Post #1" },
                })
                expect(post).not.to.be.null
                expect(post).to.be.eql({
                    id: postId,
                    title: "Post #1",
                })

                const category = await manager.findOne(Category, {
                    where: { name: "Category #1" },
                })
                expect(category).not.to.be.null
                expect(category).to.be.eql({
                    id: categoryId,
                    name: "Category #1",
                })
            })

            it(`should not save anything if any of operation in transaction fail`, async () => {
                const { manager } = getDataSourceOrFail(driver, connectionsMap)

                let postId: number | undefined = undefined,
                    categoryId: number | undefined = undefined

                try {
                    await manager.transactionWithContext(async () => {
                        const post = new Post()
                        post.title = "Post #1"
                        await manager.save(post)

                        const category = new Category()
                        category.name = "Category #1"
                        await manager.save(category)

                        postId = post.id
                        categoryId = category.id

                        const loadedPost = await manager.findOne(Post, {
                            where: { title: "Post #1" },
                        })
                        expect(loadedPost).not.to.be.null
                        expect(loadedPost).to.be.eql({
                            id: postId,
                            title: "Post #1",
                        })

                        const loadedCategory = await manager.findOne(Category, {
                            where: { name: "Category #1" },
                        })
                        expect(loadedCategory).not.to.be.null
                        expect(loadedCategory).to.be.eql({
                            id: categoryId,
                            name: "Category #1",
                        })

                        // now try to save post without title - it will fail and transaction will be reverted
                        const wrongPost = new Post()
                        await manager.save(wrongPost)
                    })
                } catch (err) {
                    /* skip error */
                }

                const post = await manager.findOne(Post, {
                    where: { title: "Post #1" },
                })
                expect(post).to.be.null

                const category = await manager.findOne(Category, {
                    where: { name: "Category #1" },
                })
                expect(category).to.be.null
            })
        })
    }
})
