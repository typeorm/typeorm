import { DataSource, InnerJoin, LeftJoin } from "../../../../src"
import "../../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { User } from "./entity/User"
import { Post } from "./entity/Post"
import { expect } from "chai"
import { Category } from "./entity/Category"

describe("find options > inner join operator", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [User, Post, Category],
            enabledDrivers: ["postgres", "mysql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const prepareData = async (dataSource: DataSource) => {
        const foo = new User()
        foo.name = "Foo"
        await dataSource.manager.save(foo)

        const bar = new User()
        bar.name = "Bar"
        await dataSource.manager.save(bar)

        const category1 = new Category()
        category1.name = "Category 1"
        await dataSource.manager.save(category1)

        const post1 = new Post()
        post1.title = "Hello"
        post1.owner = foo
        post1.category = category1
        await dataSource.manager.save(post1)

        const post2 = new Post()
        post2.title = "Bye"
        post2.owner = foo

        await dataSource.manager.save(post2)
    }

    it("should work with inner join operator", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const usersWithPosts = await dataSource.manager.find(User, {
                    relations: {
                        posts: InnerJoin(),
                    },
                })

                usersWithPosts.should.have.length(1)
                usersWithPosts[0].name.should.be.equal("Foo")
                usersWithPosts[0].posts.should.have.length(2)
            }),
        )
    })

    it("should work with left join operator", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const users = await dataSource.manager.find(User, {
                    relations: {
                        posts: LeftJoin(),
                    },
                })

                users.should.have.length(2)

                const foo = users.find((user) => user.name === "Foo")
                const bar = users.find((user) => user.name === "Bar")
                expect(foo).to.exist
                expect(bar).to.exist

                foo!.posts.should.have.length(2)
                bar!.posts.should.have.length(0)
            }),
        )
    })

    it("should work with nested inner join operator", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const usersPostsWithCategory = await dataSource.manager.find(
                    User,
                    {
                        relations: {
                            posts: {
                                category: InnerJoin(),
                            },
                        },
                    },
                )

                usersPostsWithCategory.should.have.length(1)
                usersPostsWithCategory[0].name.should.be.equal("Foo")
                usersPostsWithCategory[0].posts.should.have.length(1)
                usersPostsWithCategory[0].posts[0].category.should.exist
            }),
        )
    })

    it("should work with boolean", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const users = await dataSource.manager.find(User, {
                    relations: {
                        posts: true,
                    },
                })

                users.should.have.length(2)
                const foo = users.find((user) => user.name === "Foo")
                const bar = users.find((user) => user.name === "Bar")

                expect(foo).to.exist
                expect(bar).to.exist

                foo!.posts.should.have.length(2)
                bar!.posts.should.have.length(0)
            }),
        )
    })
})
