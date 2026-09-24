import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { CategoryWithCompositePK } from "./entity/CategoryWithCompositePK"
import { User } from "./entity/User"

describe("query-builder > join > composite primary key", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("leftJoin with composite primary keys", () => {
        it("should work correctly when all composite primary key columns are selected", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const user = new User()
                    user.name = "Test User"
                    await dataSource.manager.save(user)

                    const category1 = new CategoryWithCompositePK()
                    category1.categoryId = 1
                    category1.categoryType = "tech"
                    category1.name = "Technology"
                    await dataSource.manager.save(category1)

                    const category2 = new CategoryWithCompositePK()
                    category2.categoryId = 2
                    category2.categoryType = "science"
                    category2.name = "Science"
                    await dataSource.manager.save(category2)

                    const post = new Post()
                    post.title = "Test Post"
                    post.author = user
                    post.compositePKCategories = [category1, category2]
                    await dataSource.manager.save(post)

                    // All composite PK columns selected - should work correctly
                    const result = await dataSource
                        .getRepository(Post)
                        .createQueryBuilder("post")
                        .leftJoin(
                            "post.compositePKCategories",
                            "compositePKCategory",
                        )
                        .select([
                            "post.id",
                            "post.title",
                            "compositePKCategory.categoryId",
                            "compositePKCategory.categoryType",
                            "compositePKCategory.name",
                        ])
                        .skip(0)
                        .take(1)
                        .getMany()

                    expect(result).to.have.lengthOf(1)
                    expect(result[0].compositePKCategories).to.have.lengthOf(2)
                    result[0].compositePKCategories.forEach((category) => {
                        expect(category.categoryId).to.be.a("number")
                        expect(category.categoryType).to.be.a("string")
                        expect(category.name).to.be.a("string")
                    })
                }),
            ))

        it("should work correctly when only part of composite primary key is selected", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const user = new User()
                    user.name = "Test User"
                    await dataSource.manager.save(user)

                    const category1 = new CategoryWithCompositePK()
                    category1.categoryId = 1
                    category1.categoryType = "tech"
                    category1.name = "Technology"
                    await dataSource.manager.save(category1)

                    const category2 = new CategoryWithCompositePK()
                    category2.categoryId = 2
                    category2.categoryType = "science"
                    category2.name = "Science"
                    await dataSource.manager.save(category2)

                    const post = new Post()
                    post.title = "Test Post"
                    post.author = user
                    post.compositePKCategories = [category1, category2]
                    await dataSource.manager.save(post)

                    // Only one of the composite PK columns selected (partial PK)
                    const result = await dataSource
                        .getRepository(Post)
                        .createQueryBuilder("post")
                        .leftJoin(
                            "post.compositePKCategories",
                            "compositePKCategory",
                        )
                        .select([
                            "post.id",
                            "post.title",
                            "compositePKCategory.categoryId", // Only categoryId, not categoryType
                            "compositePKCategory.name",
                        ])
                        .skip(0)
                        .take(1)
                        .getMany()

                    expect(result).to.have.lengthOf(1)
                    expect(result[0].compositePKCategories).to.have.lengthOf(2)
                    result[0].compositePKCategories.forEach((category) => {
                        expect(category.categoryId).to.be.a("number")
                        expect(category.name).to.be.a("string")
                    })
                }),
            ))

        it("should work correctly when no composite primary key columns are selected", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const user = new User()
                    user.name = "Test User"
                    await dataSource.manager.save(user)

                    const category1 = new CategoryWithCompositePK()
                    category1.categoryId = 1
                    category1.categoryType = "tech"
                    category1.name = "Technology"
                    await dataSource.manager.save(category1)

                    const category2 = new CategoryWithCompositePK()
                    category2.categoryId = 2
                    category2.categoryType = "science"
                    category2.name = "Science"
                    await dataSource.manager.save(category2)

                    const post = new Post()
                    post.title = "Test Post"
                    post.author = user
                    post.compositePKCategories = [category1, category2]
                    await dataSource.manager.save(post)

                    // No composite PK columns selected - only name
                    const result = await dataSource
                        .getRepository(Post)
                        .createQueryBuilder("post")
                        .leftJoin(
                            "post.compositePKCategories",
                            "compositePKCategory",
                        )
                        .select([
                            "post.id",
                            "post.title",
                            "compositePKCategory.name", // Only name, no PK columns
                        ])
                        .skip(0)
                        .take(1)
                        .getMany()

                    expect(result).to.have.lengthOf(1)
                    expect(result[0].compositePKCategories).to.have.lengthOf(2)
                    result[0].compositePKCategories.forEach((category) => {
                        expect(category.name).to.be.a("string")
                    })
                }),
            ))
    })
})
