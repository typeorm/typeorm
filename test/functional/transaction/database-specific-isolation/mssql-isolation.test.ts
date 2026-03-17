import { expect } from "chai"
import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"

describe("transaction > transaction with mssql dataSource isolation support", () => {
    const isolationLevels = [
        "READ UNCOMMITTED",
        "SERIALIZABLE",
        "REPEATABLE READ",
        "READ COMMITTED",
        "SNAPSHOT",
    ] as const

    async function prepareDataAndTest(dataSource: DataSource) {
        const post = new Post()
        post.title = "Post #1"
        await dataSource.manager.save(post)

        const category = new Category()
        category.name = "Category #1"
        await dataSource.manager.save(category)

        const loadedPost = await dataSource.manager.findOne(Post, {
            where: { title: "Post #1" },
        })

        expect(loadedPost).not.to.be.null
        loadedPost!.should.be.eql({
            id: post.id,
            title: "Post #1",
        })

        const loadedCategory = await dataSource.manager.findOne(Category, {
            where: { name: "Category #1" },
        })
        expect(loadedCategory).not.to.be.null
        loadedCategory!.should.be.eql({
            id: category.id,
            name: "Category #1",
        })
    }

    for (const isolationLevel of isolationLevels) {
        // As per SqlServerDataSourceOptions: The default isolation level for new connections. All out-of-transaction queries are executed with this setting.
        describe(`default ${isolationLevel} isolation level for new connections`, () => {
            let dataSources: DataSource[]
            before(async () => {
                dataSources = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["mssql"],
                    driverSpecific: {
                        options: {
                            connectionIsolationLevel: isolationLevel,
                        },
                    },
                })
            })
            beforeEach(() => reloadTestingDatabases(dataSources))
            after(() => closeTestingConnections(dataSources))

            it(`should execute all operations with default ${isolationLevel} level for new connections`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareDataAndTest(dataSource)
                    }),
                ))
        })

        // As per SqlServerDataSourceOptions: The default isolation level that transactions will be run with.
        describe(`default ${isolationLevel} isolation level`, () => {
            let dataSources: DataSource[]
            before(async () => {
                dataSources = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["mssql"],
                    driverSpecific: {
                        options: {
                            isolationLevel: isolationLevel,
                        },
                    },
                })
            })
            beforeEach(() => reloadTestingDatabases(dataSources))
            after(() => closeTestingConnections(dataSources))

            it(`should execute all operations with default ${isolationLevel} level`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareDataAndTest(dataSource)
                    }),
                ))
        })
    }
})
