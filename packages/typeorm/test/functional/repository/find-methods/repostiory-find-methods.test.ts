import "reflect-metadata"
import { assert, expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { Counters } from "./entity/Counters"
import type { User } from "./model/User"
import { EntityNotFoundError } from "../../../../src/error/EntityNotFoundError"
import { UserEntity } from "./schema/UserEntity"

describe("repository > find methods", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post, Category, UserEntity],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("count", function () {
        it("should return a full count when no criteria given", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)

                    for (let i = 0; i < 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.title = "post #" + i
                        post.categoryName = "other"
                        await postRepository.save(post)
                    }

                    // check count method
                    const count = await postRepository.count({
                        order: { id: "ASC" },
                    })
                    count.should.be.equal(100)
                }),
            ))

        it("should return a count of posts that match given criteria", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)
                    for (let i = 1; i <= 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.title = "post #" + i
                        post.categoryName = i % 2 === 0 ? "even" : "odd"
                        await postRepository.save(post)
                    }

                    // check count method
                    const count = await postRepository.count({
                        where: { categoryName: "odd" },
                        order: { id: "ASC" },
                    })
                    count.should.be.equal(50)
                }),
            ))

        it("should return a count of posts that match given multiple criteria", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)
                    for (let i = 1; i <= 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.title = "post #" + i
                        post.categoryName = i % 2 === 0 ? "even" : "odd"
                        post.isNew = i > 90
                        await postRepository.save(post)
                    }

                    // check count method
                    const count = await postRepository.count({
                        where: { categoryName: "odd", isNew: true },
                        order: { id: "ASC" },
                    })
                    count.should.be.equal(5)
                }),
            ))

        it("should return a count of posts that match given find options", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)
                    for (let i = 1; i <= 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.isNew = i > 90
                        post.title = post.isNew
                            ? "new post #" + i
                            : "post #" + i
                        post.categoryName = i % 2 === 0 ? "even" : "odd"
                        await postRepository.save(post)
                    }

                    // check count method
                    const count = await postRepository.count()
                    count.should.be.equal(100)
                }),
            ))

        it("should return a count of posts that match both criteria and find options", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)
                    for (let i = 1; i <= 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.isNew = i > 90
                        post.title = post.isNew
                            ? "new post #" + i
                            : "post #" + i
                        post.categoryName = i % 2 === 0 ? "even" : "odd"
                        await postRepository.save(post)
                    }

                    // check count method
                    const count = await postRepository.count({
                        where: { categoryName: "even", isNew: true },
                        skip: 1,
                        take: 2,
                        order: { id: "ASC" },
                    })
                    count.should.be.equal(5)
                }),
            ))

        it("should support distinct count when select is provided", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(Category)

                    await repository.save([
                        { id: 1, name: "Bears" },
                        { id: 2, name: "Bears" },
                        { id: 3, name: "Cats" },
                    ])

                    const count1 = await repository.count({
                        select: { name: true },
                    })
                    const count2 = await repository.count({
                        select: { name: true },
                        where: { name: "Bears" },
                    })
                    const count3 = await repository.count()

                    expect(count1).to.equal(2)
                    expect(count2).to.equal(1)
                    expect(count3).to.equal(3)
                }),
            ))

        it("should support distinct count with embed", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(Post)
                    const firstPost = new Post()
                    firstPost.id = 1
                    firstPost.title = "post #1"
                    firstPost.categoryName = "other"
                    firstPost.counters = new Counters()
                    firstPost.counters.likes = 1
                    await repository.save(firstPost)

                    const secondPost = new Post()
                    secondPost.id = 2
                    secondPost.title = "post #2"
                    secondPost.categoryName = "other"
                    secondPost.counters = new Counters()
                    secondPost.counters.likes = 2
                    await repository.save(secondPost)

                    const count = await repository.count({
                        select: {
                            counters: {
                                likes: true,
                            },
                        },
                    })
                    count.should.be.equal(2)
                }),
            ))

        it("should support distinct count with relation select", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const categoryRepository =
                        dataSource.getRepository(Category)
                    const postRepository = dataSource.getRepository(Post)

                    const bear1 = await categoryRepository.save({
                        id: 1,
                        name: "Bears",
                    })
                    const bear2 = await categoryRepository.save({
                        id: 2,
                        name: "Bears",
                    })
                    const cats = await categoryRepository.save({
                        id: 3,
                        name: "Cats",
                    })

                    const firstPost = new Post()
                    firstPost.id = 1
                    firstPost.title = "post #1"
                    firstPost.categoryName = "other"
                    firstPost.category = bear1
                    await postRepository.save(firstPost)

                    const secondPost = new Post()
                    secondPost.id = 2
                    secondPost.title = "post #2"
                    secondPost.categoryName = "other"
                    secondPost.category = bear2
                    await postRepository.save(secondPost)

                    const thirdPost = new Post()
                    thirdPost.id = 3
                    thirdPost.title = "post #3"
                    thirdPost.categoryName = "other"
                    thirdPost.category = cats
                    await postRepository.save(thirdPost)

                    const count1 = await postRepository.count({
                        select: {
                            category: {
                                name: true,
                            },
                        },
                        relations: {
                            category: true,
                        },
                    })
                    const count2 = await postRepository.count()

                    count1.should.be.equal(2)
                    count2.should.be.equal(3)
                }),
            ))

        it("should support distinct count with embedded relation select", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const categoryRepository =
                        dataSource.getRepository(Category)
                    const postRepository = dataSource.getRepository(Post)

                    const bear1 = await categoryRepository.save({
                        id: 1,
                        name: "Bears",
                    })
                    const bear2 = await categoryRepository.save({
                        id: 2,
                        name: "Bears",
                    })
                    const cats = await categoryRepository.save({
                        id: 3,
                        name: "Cats",
                    })

                    const firstPost = new Post()
                    firstPost.id = 1
                    firstPost.title = "post #1"
                    firstPost.categoryName = "other"
                    firstPost.counters = new Counters()
                    firstPost.counters.likes = 1
                    firstPost.counters.category = bear1
                    await postRepository.save(firstPost)

                    const secondPost = new Post()
                    secondPost.id = 2
                    secondPost.title = "post #2"
                    secondPost.categoryName = "other"
                    secondPost.counters = new Counters()
                    secondPost.counters.likes = 2
                    secondPost.counters.category = bear2
                    await postRepository.save(secondPost)

                    const thirdPost = new Post()
                    thirdPost.id = 3
                    thirdPost.title = "post #3"
                    thirdPost.categoryName = "other"
                    thirdPost.counters = new Counters()
                    thirdPost.counters.likes = 3
                    thirdPost.counters.category = cats
                    await postRepository.save(thirdPost)

                    const count1 = await postRepository.count({
                        select: {
                            counters: {
                                category: {
                                    name: true,
                                },
                            },
                        },
                        relations: {
                            counters: {
                                category: true,
                            },
                        },
                    })
                    const count2 = await postRepository.count()

                    count1.should.be.equal(2)
                    count2.should.be.equal(3)
                }),
            ))
    })

    describe("exists", function () {
        it("should return a True when no criteria given", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)

                    for (let i = 0; i < 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.title = "post #" + i
                        post.categoryName = "other"
                        await postRepository.save(post)
                    }

                    // check exists method
                    const exists = await postRepository.exists({
                        order: { id: "ASC" },
                    })
                    exists.should.be.equal(true)
                }),
            ))

        it("should return True when matches the given criteria", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)
                    for (let i = 1; i <= 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.title = "post #" + i
                        post.categoryName = i % 2 === 0 ? "even" : "odd"
                        await postRepository.save(post)
                    }

                    // check exists method
                    const exists = await postRepository.exists({
                        where: { categoryName: "odd" },
                        order: { id: "ASC" },
                    })
                    exists.should.be.equal(true)
                }),
            ))

        it("should return True when matches the given multiple criteria", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)
                    for (let i = 1; i <= 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.title = "post #" + i
                        post.categoryName = i % 2 === 0 ? "even" : "odd"
                        post.isNew = i > 90
                        await postRepository.save(post)
                    }

                    // check exists method
                    const exists = await postRepository.exists({
                        where: { categoryName: "odd", isNew: true },
                        order: { id: "ASC" },
                    })
                    exists.should.be.equal(true)
                }),
            ))

        it("should return True when matches the given find options", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)
                    for (let i = 1; i <= 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.isNew = i > 90
                        post.title = post.isNew
                            ? "new post #" + i
                            : "post #" + i
                        post.categoryName = i % 2 === 0 ? "even" : "odd"
                        await postRepository.save(post)
                    }

                    // check exists method
                    const exists = await postRepository.exists()
                    exists.should.be.equal(true)
                }),
            ))

        it("should return True when matches both criteria and find options", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)
                    for (let i = 1; i <= 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.isNew = i > 90
                        post.title = post.isNew
                            ? "new post #" + i
                            : "post #" + i
                        post.categoryName = i % 2 === 0 ? "even" : "odd"
                        await postRepository.save(post)
                    }

                    // check exists method
                    const exists = await postRepository.exists({
                        where: { categoryName: "even", isNew: true },
                        skip: 1,
                        take: 2,
                        order: { id: "ASC" },
                    })
                    exists.should.be.equal(true)
                }),
            ))
    })

    describe("find and findAndCount", function () {
        it("should return everything when no criteria given", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)

                    for (let i = 0; i < 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.title = "post #" + i
                        post.categoryName = "other"
                        await postRepository.save(post)
                    }

                    // check find method
                    const loadedPosts = await postRepository.find({
                        order: { id: "ASC" },
                    })
                    loadedPosts.should.be.instanceOf(Array)
                    loadedPosts.length.should.be.equal(100)
                    loadedPosts[0].id.should.be.equal(0)
                    loadedPosts[0].title.should.be.equal("post #0")
                    loadedPosts[99].id.should.be.equal(99)
                    loadedPosts[99].title.should.be.equal("post #99")

                    // check findAndCount method
                    const [loadedPosts2, count] =
                        await postRepository.findAndCount({
                            order: { id: "ASC" },
                        })
                    count.should.be.equal(100)
                    loadedPosts2.should.be.instanceOf(Array)
                    loadedPosts2.length.should.be.equal(100)
                    loadedPosts2[0].id.should.be.equal(0)
                    loadedPosts2[0].title.should.be.equal("post #0")
                    loadedPosts2[99].id.should.be.equal(99)
                    loadedPosts2[99].title.should.be.equal("post #99")
                }),
            ))

        it("should return posts that match given criteria", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)

                    for (let i = 1; i <= 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.title = "post #" + i
                        post.categoryName = i % 2 === 0 ? "even" : "odd"
                        await postRepository.save(post)
                    }

                    // check find method
                    const loadedPosts = await postRepository.find({
                        where: { categoryName: "odd" },
                        order: { id: "ASC" },
                    })
                    loadedPosts.should.be.instanceOf(Array)
                    loadedPosts.length.should.be.equal(50)
                    loadedPosts[0].id.should.be.equal(1)
                    loadedPosts[0].title.should.be.equal("post #1")
                    loadedPosts[49].id.should.be.equal(99)
                    loadedPosts[49].title.should.be.equal("post #99")

                    // check findAndCount method
                    const [loadedPosts2, count] =
                        await postRepository.findAndCount({
                            where: { categoryName: "odd" },
                            order: { id: "ASC" },
                        })
                    count.should.be.equal(50)
                    loadedPosts2.should.be.instanceOf(Array)
                    loadedPosts2.length.should.be.equal(50)
                    loadedPosts2[0].id.should.be.equal(1)
                    loadedPosts2[0].title.should.be.equal("post #1")
                    loadedPosts2[49].id.should.be.equal(99)
                    loadedPosts2[49].title.should.be.equal("post #99")
                }),
            ))

        it("should return posts that match given multiple criteria", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)

                    for (let i = 1; i <= 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.title = "post #" + i
                        post.categoryName = i % 2 === 0 ? "even" : "odd"
                        post.isNew = i > 90
                        await postRepository.save(post)
                    }

                    // check find method
                    const loadedPosts = await postRepository.find({
                        where: { categoryName: "odd", isNew: true },
                        order: { id: "ASC" },
                    })
                    loadedPosts.should.be.instanceOf(Array)
                    loadedPosts.length.should.be.equal(5)
                    loadedPosts[0].id.should.be.equal(91)
                    loadedPosts[0].title.should.be.equal("post #91")
                    loadedPosts[4].id.should.be.equal(99)
                    loadedPosts[4].title.should.be.equal("post #99")

                    // check findAndCount method
                    const [loadedPosts2, count] =
                        await postRepository.findAndCount({
                            where: { categoryName: "odd", isNew: true },
                            order: { id: "ASC" },
                        })
                    count.should.be.equal(5)
                    loadedPosts2.should.be.instanceOf(Array)
                    loadedPosts2.length.should.be.equal(5)
                    loadedPosts2[0].id.should.be.equal(91)
                    loadedPosts2[0].title.should.be.equal("post #91")
                    loadedPosts2[4].id.should.be.equal(99)
                    loadedPosts2[4].title.should.be.equal("post #99")
                }),
            ))

        it("should return posts that match given find options", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)

                    for (let i = 1; i <= 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.isNew = i > 90
                        post.title = post.isNew
                            ? "new post #" + i
                            : "post #" + i
                        post.categoryName = i % 2 === 0 ? "even" : "odd"
                        await postRepository.save(post)
                    }

                    // check find method
                    const loadedPosts = await postRepository
                        .createQueryBuilder("post")
                        .where(
                            "post.title LIKE :likeTitle AND post.categoryName = :categoryName",
                        )
                        .setParameters({
                            likeTitle: "new post #%",
                            categoryName: "even",
                        })
                        .orderBy("post.id", "ASC")
                        .getMany()
                    loadedPosts.should.be.instanceOf(Array)
                    loadedPosts.length.should.be.equal(5)
                    loadedPosts[0].id.should.be.equal(92)
                    loadedPosts[0].title.should.be.equal("new post #92")
                    loadedPosts[4].id.should.be.equal(100)
                    loadedPosts[4].title.should.be.equal("new post #100")

                    // check findAndCount method
                    const [loadedPosts2, count] = await postRepository
                        .createQueryBuilder("post")
                        .where(
                            "post.title LIKE :likeTitle AND post.categoryName = :categoryName",
                        )
                        .setParameters({
                            likeTitle: "new post #%",
                            categoryName: "even",
                        })
                        .orderBy("post.id", "ASC")
                        .getManyAndCount()
                    count.should.be.equal(5)
                    loadedPosts2.should.be.instanceOf(Array)
                    loadedPosts2.length.should.be.equal(5)
                    loadedPosts2[0].id.should.be.equal(92)
                    loadedPosts2[0].title.should.be.equal("new post #92")
                    loadedPosts2[4].id.should.be.equal(100)
                    loadedPosts2[4].title.should.be.equal("new post #100")
                }),
            ))

        it("should return posts that match both criteria and find options", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository = dataSource.getRepository(Post)

                    for (let i = 1; i <= 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.isNew = i > 90
                        post.title = post.isNew
                            ? "new post #" + i
                            : "post #" + i
                        post.categoryName = i % 2 === 0 ? "even" : "odd"
                        await postRepository.save(post)
                    }

                    // check find method
                    const loadedPosts = await postRepository.find({
                        where: {
                            categoryName: "even",
                            isNew: true,
                        },
                        skip: 1,
                        take: 2,
                        order: {
                            id: "ASC",
                        },
                    })
                    loadedPosts.should.be.instanceOf(Array)
                    loadedPosts.length.should.be.equal(2)
                    loadedPosts[0].id.should.be.equal(94)
                    loadedPosts[0].title.should.be.equal("new post #94")
                    loadedPosts[1].id.should.be.equal(96)
                    loadedPosts[1].title.should.be.equal("new post #96")

                    // check findAndCount method
                    const [loadedPosts2, count] =
                        await postRepository.findAndCount({
                            where: {
                                categoryName: "even",
                                isNew: true,
                            },
                            skip: 1,
                            take: 2,
                            order: {
                                id: "ASC",
                            },
                        })
                    count.should.be.equal(5)
                    loadedPosts2.should.be.instanceOf(Array)
                    loadedPosts2.length.should.be.equal(2)
                    loadedPosts2[0].id.should.be.equal(94)
                    loadedPosts2[0].title.should.be.equal("new post #94")
                    loadedPosts2[1].id.should.be.equal(96)
                    loadedPosts2[1].title.should.be.equal("new post #96")
                }),
            ))
    })

    describe("findOne", function () {
        it("should throw an error when no criteria given", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const userRepository =
                        dataSource.getRepository<User>("User")

                    for (let i = 0; i < 100; i++) {
                        const user: User = {
                            id: i,
                            firstName: "name #" + i,
                            secondName: "Doe",
                        }
                        await userRepository.save(user)
                    }

                    return userRepository
                        .findOne({
                            order: { id: "ASC" },
                        })
                        .should.be.rejectedWith(
                            `You must provide selection conditions in order to find a single row.`,
                        )
                }),
            ))

        it("should return when criteria given", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const userRepository =
                        dataSource.getRepository<User>("User")

                    for (let i = 0; i < 100; i++) {
                        const user: User = {
                            id: i,
                            firstName: "name #" + i,
                            secondName: "Doe",
                        }
                        await userRepository.save(user)
                    }

                    const loadedUser = (await userRepository.findOne({
                        where: { firstName: "name #1" },
                        order: { id: "ASC" },
                    }))!
                    loadedUser.id.should.be.equal(1)
                    loadedUser.firstName.should.be.equal("name #1")
                    loadedUser.secondName.should.be.equal("Doe")
                }),
            ))

        it("should return when find options given", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const userRepository =
                        dataSource.getRepository<User>("User")

                    for (let i = 0; i < 100; i++) {
                        const user: User = {
                            id: i,
                            firstName: "name #" + i,
                            secondName: "Doe",
                        }
                        await userRepository.save(user)
                    }

                    const loadedUser = await userRepository.findOne({
                        where: {
                            firstName: "name #99",
                            secondName: "Doe",
                        },
                        order: {
                            id: "ASC",
                        },
                    })
                    loadedUser!.id.should.be.equal(99)
                    loadedUser!.firstName.should.be.equal("name #99")
                    loadedUser!.secondName.should.be.equal("Doe")
                }),
            ))
    })

    describe("findOne", function () {
        it("should return entity by a given id", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const userRepository =
                        dataSource.getRepository<User>("User")

                    for (let i = 0; i < 100; i++) {
                        const user: User = {
                            id: i,
                            firstName: "name #" + i,
                            secondName: "Doe",
                        }
                        await userRepository.save(user)
                    }

                    let loadedUser = (await userRepository.findOneBy({
                        id: 0,
                    }))!
                    loadedUser.id.should.be.equal(0)
                    loadedUser.firstName.should.be.equal("name #0")
                    loadedUser.secondName.should.be.equal("Doe")

                    loadedUser = (await userRepository.findOneBy({
                        id: 1,
                    }))!
                    loadedUser.id.should.be.equal(1)
                    loadedUser.firstName.should.be.equal("name #1")
                    loadedUser.secondName.should.be.equal("Doe")

                    loadedUser = (await userRepository.findOneBy({
                        id: 99,
                    }))!
                    loadedUser.id.should.be.equal(99)
                    loadedUser.firstName.should.be.equal("name #99")
                    loadedUser.secondName.should.be.equal("Doe")
                }),
            ))

        it("should return entity by a given id and find options", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const userRepository =
                        dataSource.getRepository<User>("User")

                    for (let i = 0; i < 100; i++) {
                        const user: User = {
                            id: i,
                            firstName: "name #" + i,
                            secondName: "Doe",
                        }
                        await userRepository.save(user)
                    }

                    let loadedUser = await userRepository.findOneBy({
                        id: 0,
                        secondName: "Doe",
                    })
                    loadedUser!.id.should.be.equal(0)
                    loadedUser!.firstName.should.be.equal("name #0")
                    loadedUser!.secondName.should.be.equal("Doe")

                    loadedUser = await userRepository.findOneBy({
                        id: 1,
                        secondName: "Dorian",
                    })
                    expect(loadedUser).to.be.null
                }),
            ))
    })

    describe("findOneOrFail", function () {
        it("should return entity by a given id", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const userRepository =
                        dataSource.getRepository<User>("User")

                    for (let i = 0; i < 100; i++) {
                        const user: User = {
                            id: i,
                            firstName: "name #" + i,
                            secondName: "Doe",
                        }
                        await userRepository.save(user)
                    }

                    let loadedUser = await userRepository.findOneByOrFail({
                        id: 0,
                    })
                    loadedUser.id.should.be.equal(0)
                    loadedUser.firstName.should.be.equal("name #0")
                    loadedUser.secondName.should.be.equal("Doe")

                    loadedUser = (await userRepository.findOneByOrFail({
                        id: 1,
                    }))!
                    loadedUser.id.should.be.equal(1)
                    loadedUser.firstName.should.be.equal("name #1")
                    loadedUser.secondName.should.be.equal("Doe")

                    loadedUser = (await userRepository.findOneByOrFail({
                        id: 99,
                    }))!
                    loadedUser.id.should.be.equal(99)
                    loadedUser.firstName.should.be.equal("name #99")
                    loadedUser.secondName.should.be.equal("Doe")
                }),
            ))

        it("should return entity by a given id and find options", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const userRepository =
                        dataSource.getRepository<User>("User")

                    for (let i = 0; i < 100; i++) {
                        const user: User = {
                            id: i,
                            firstName: "name #" + i,
                            secondName: "Doe",
                        }
                        await userRepository.save(user)
                    }

                    const loadedUser = await userRepository.findOneByOrFail({
                        id: 0,
                        secondName: "Doe",
                    })
                    loadedUser!.id.should.be.equal(0)
                    loadedUser!.firstName.should.be.equal("name #0")
                    loadedUser!.secondName.should.be.equal("Doe")

                    const options = {
                        where: {
                            id: 1,
                            secondName: "Dorian",
                        },
                    }
                    try {
                        await userRepository.findOneOrFail(options)
                        assert.fail("Should have thrown an error.")
                    } catch (err) {
                        expect(err).to.be.an.instanceOf(EntityNotFoundError)
                        expect(err).to.have.property("entityClass", "User")
                        expect(err).to.have.property("criteria", options)
                    }
                }),
            ))

        it("should throw an error if nothing was found", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const userRepository =
                        dataSource.getRepository<User>("User")

                    for (let i = 0; i < 100; i++) {
                        const user: User = {
                            id: i,
                            firstName: "name #" + i,
                            secondName: "Doe",
                        }
                        await userRepository.save(user)
                    }

                    await userRepository
                        .findOneByOrFail({
                            id: 100,
                        })
                        .should.eventually.be.rejectedWith(EntityNotFoundError)
                }),
            ))
    })
})
