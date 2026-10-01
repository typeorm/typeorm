import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { User } from "./entity/User"
import { Photo } from "./entity/Photo"

describe("query-builder > take > with joins", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("leftJoin with skip/take pagination", () => {
        it("should work correctly when leftJoin used with addSelect and pagination without primary key", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const user1 = new User()
                    user1.name = "Test User 1"
                    await dataSource.manager.save(user1)

                    const user2 = new User()
                    user2.name = "Test User 2"
                    await dataSource.manager.save(user2)

                    const category1 = new Category()
                    category1.name = "Category 1"
                    await dataSource.manager.save(category1)

                    const category2 = new Category()
                    category2.name = "Category 2"
                    await dataSource.manager.save(category2)

                    const post1 = new Post()
                    post1.title = "Post 1"
                    post1.author = user1
                    post1.categories = [category1, category2]
                    await dataSource.manager.save(post1)

                    const post2 = new Post()
                    post2.title = "Post 2"
                    post2.author = user2
                    post2.categories = [category1]
                    await dataSource.manager.save(post2)

                    // This is the problematic query that was fixed
                    const result = await dataSource
                        .getRepository(Post)
                        .createQueryBuilder("post")
                        .leftJoin("post.categories", "category")
                        .select([
                            "post.id",
                            "post.title",
                            "category.name", // Note: category.id is NOT selected
                        ])
                        .skip(0)
                        .take(2)
                        .getMany()

                    expect(result).to.have.lengthOf(2)
                    result.forEach((post) => {
                        expect(post.categories).to.not.be.undefined
                        expect(post.categories.length).to.be.greaterThan(0)
                        post.categories.forEach((category) => {
                            expect(category.name).to.be.a("string")
                        })
                    })

                    // Verify that post1 still has 2 categories and post2 has 1
                    const post1Result = result.find((p) => p.title === "Post 1")
                    const post2Result = result.find((p) => p.title === "Post 2")

                    expect(post1Result).to.not.be.undefined
                    expect(post2Result).to.not.be.undefined
                    expect(post1Result!.categories).to.have.lengthOf(2)
                    expect(post2Result!.categories).to.have.lengthOf(1)
                }),
            ))

        it("should work correctly with leftJoinAndSelect as comparison", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const user = new User()
                    user.name = "Test User"
                    await dataSource.manager.save(user)

                    const category1 = new Category()
                    category1.name = "Category 1"
                    await dataSource.manager.save(category1)

                    const category2 = new Category()
                    category2.name = "Category 2"
                    await dataSource.manager.save(category2)

                    const post = new Post()
                    post.title = "Test Post"
                    post.author = user
                    post.categories = [category1, category2]
                    await dataSource.manager.save(post)

                    // This should work without issues
                    const result = await dataSource
                        .getRepository(Post)
                        .createQueryBuilder("post")
                        .leftJoinAndSelect("post.categories", "category")
                        .skip(0)
                        .take(1)
                        .getMany()

                    expect(result).to.have.lengthOf(1)
                    expect(result[0].categories).to.have.lengthOf(2)
                    result[0].categories.forEach((category) => {
                        expect(category.id).to.be.a("number")
                        expect(category.name).to.be.a("string")
                    })
                }),
            ))

        it("should work correctly with explicit primary key selection", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const user = new User()
                    user.name = "Test User"
                    await dataSource.manager.save(user)

                    const category1 = new Category()
                    category1.name = "Category 1"
                    await dataSource.manager.save(category1)

                    const category2 = new Category()
                    category2.name = "Category 2"
                    await dataSource.manager.save(category2)

                    const post = new Post()
                    post.title = "Test Post"
                    post.author = user
                    post.categories = [category1, category2]
                    await dataSource.manager.save(post)

                    // This works because primary key is explicitly selected
                    const result = await dataSource
                        .getRepository(Post)
                        .createQueryBuilder("post")
                        .leftJoin("post.categories", "category")
                        .select([
                            "post.id",
                            "post.title",
                            "category.id", // Primary key explicitly selected
                            "category.name",
                        ])
                        .skip(0)
                        .take(1)
                        .getMany()

                    expect(result).to.have.lengthOf(1)
                    expect(result[0].categories).to.have.lengthOf(2)
                    result[0].categories.forEach((category) => {
                        expect(category.id).to.be.a("number")
                        expect(category.name).to.be.a("string")
                    })
                }),
            ))
    })

    it("should return correct number of results when limit is used with left joins", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                for (let i = 1; i <= 7; i++) {
                    const user = new User()
                    user.name = `User ${i}`
                    await manager.save(user)

                    for (let j = 1; j <= 2; j++) {
                        const photo = new Photo()
                        photo.name = `Photo ${i}-${j}`
                        photo.user = user
                        await manager.save(photo)
                    }
                }

                const qb = manager
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.photos", "photo")
                    .orderBy("user.id")
                    .limit(5)

                const users = await qb.getMany()
                expect(users).to.have.lengthOf(5)
                users.forEach((user) => {
                    expect(user.photos).to.have.lengthOf(2)
                })

                const rows = await qb.execute()
                const uniqueIds = new Set(
                    rows.map((row: { user_id: string }) => row.user_id),
                )
                expect(uniqueIds.size).to.equal(3)
            }),
        ))
})
