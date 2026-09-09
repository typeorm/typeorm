import type { DataSource, EntityManager } from "../../../../src"
import { Not, Regexp } from "../../../../src"
import "../../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("find options > find operators > Regexp", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            __dirname,
            enabledDrivers: ["postgres", "mysql", "better-sqlite3"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function prepareData(manager: EntityManager) {
        const post1 = new Post()
        post1.title = "Hello World"
        await manager.save(post1)

        const post2 = new Post()
        post2.title = "Hello TypeORM"
        await manager.save(post2)

        const post3 = new Post()
        post3.title = "Goodbye"
        await manager.save(post3)
    }

    it("should find entries matching regexp pattern", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource.manager)

                const loadedPosts = await dataSource.manager.find(Post, {
                    where: {
                        title: Regexp("^Hello"),
                    },
                    order: {
                        id: "asc",
                    },
                })
                loadedPosts.should.be.eql([
                    {
                        id: 1,
                        title: "Hello World",
                    },
                    {
                        id: 2,
                        title: "Hello TypeORM",
                    },
                ])
            }),
        ))

    it("should not find entries not matching regexp pattern", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource.manager)

                const loadedPosts = await dataSource.manager.find(Post, {
                    where: {
                        title: Regexp("^Goodbye$"),
                    },
                    order: {
                        id: "asc",
                    },
                })
                loadedPosts.should.be.eql([
                    {
                        id: 3,
                        title: "Goodbye",
                    },
                ])
            }),
        ))

    it("should work with Not() operator", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource.manager)

                const loadedPosts = await dataSource.manager.find(Post, {
                    where: {
                        title: Not(Regexp("^Hello")),
                    },
                    order: {
                        id: "asc",
                    },
                })
                loadedPosts.should.be.eql([
                    {
                        id: 3,
                        title: "Goodbye",
                    },
                ])
            }),
        ))
})
