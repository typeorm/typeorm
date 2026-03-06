import { expect } from "chai"
import fs from "fs/promises"
import "reflect-metadata"
import sinon from "sinon"
import { scheduler } from "timers/promises"
import { FileLogger } from "../../../../src"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Category } from "./entity/Category"
import { Photo } from "./entity/Photo"
import { Post } from "./entity/Post"
import { User } from "./entity/User"

describe("repository > find options", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should load relations", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new User()
                user.name = "Alex Messer"
                await dataSource.manager.save(user)

                const category = new Category()
                category.name = "Boys"
                await dataSource.manager.save(category)

                const post = new Post()
                post.title = "About Alex Messer"
                post.author = user
                post.categories = [category]
                await dataSource.manager.save(post)

                const [loadedPost] = await dataSource.getRepository(Post).find({
                    relations: { author: true, categories: true },
                })
                expect(loadedPost).to.be.eql({
                    id: 1,
                    title: "About Alex Messer",
                    author: {
                        id: 1,
                        name: "Alex Messer",
                    },
                    categories: [
                        {
                            id: 1,
                            name: "Boys",
                        },
                    ],
                })
            }),
        ))

    it("should execute select query inside transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new User()
                user.name = "Alex Messer"
                await dataSource.manager.save(user)

                const queryRunner = dataSource.createQueryRunner()

                const startTransactionFn = sinon.spy(
                    queryRunner,
                    "startTransaction",
                )
                const commitTransactionFn = sinon.spy(
                    queryRunner,
                    "commitTransaction",
                )

                expect(startTransactionFn.called).to.be.false
                expect(commitTransactionFn.called).to.be.false

                await dataSource
                    .createEntityManager(queryRunner)
                    .getRepository(User)
                    .findOne({
                        where: {
                            id: 1,
                        },
                        transaction: true,
                    })

                expect(startTransactionFn.calledOnce).to.be.true
                expect(commitTransactionFn.calledOnce).to.be.true

                await queryRunner.release()
            }),
        ))

    it("should select specific columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const category = new Category()
                category.name = "Bears"
                await dataSource.manager.save(category)

                const categories = [category]
                const photos = []
                for (let i = 1; i < 10; i++) {
                    const photo = new Photo()
                    photo.name = `Me and Bears ${i}`
                    photo.description = `I am near bears ${i}`
                    photo.filename = `photo-with-bears-${i}.jpg`
                    photo.views = 10
                    photo.isPublished = false
                    photo.categories = categories
                    photos.push(photo)
                    await dataSource.manager.save(photo)
                }

                const loadedPhoto = await dataSource
                    .getRepository(Photo)
                    .findOne({
                        select: { name: true },
                        where: {
                            id: 5,
                        },
                    })

                const loadedPhotos1 = await dataSource
                    .getRepository(Photo)
                    .find({
                        select: { filename: true, views: true },
                    })

                const loadedPhotos2 = await dataSource
                    .getRepository(Photo)
                    .find({
                        select: { id: true, name: true, description: true },
                        relations: { categories: true },
                    })

                // const loadedPhotos3 = await dataSource.getRepository(Photo).createQueryBuilder("photo")
                //     .select(["photo.name", "photo.description"])
                //     .addSelect(["category.name"])
                //     .leftJoin("photo.categories", "category")
                //     .getMany();

                expect(loadedPhoto).to.be.eql({
                    name: "Me and Bears 5",
                })

                expect(loadedPhotos1).to.have.deep.members(
                    photos.map((photo) => ({
                        filename: photo.filename,
                        views: photo.views,
                    })),
                )

                expect(loadedPhotos2).to.have.deep.members(
                    photos.map((photo) => ({
                        id: photo.id,
                        name: photo.name,
                        description: photo.description,
                        categories,
                    })),
                )

                // expect(loadedPhotos3).to.have.deep.members(photos.map(photo => ({
                //     name: photo.name,
                //     description: photo.description,
                //     categories: categories.map(category => ({
                //         name: category.name,
                //     })),
                // })));
            }),
        ))

    it("should select by given conditions", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const category1 = new Category()
                category1.name = "Bears"
                await dataSource.manager.save(category1)

                const category2 = new Category()
                category2.name = "Dogs"
                await dataSource.manager.save(category2)

                const category3 = new Category()
                category3.name = "Cats"
                await dataSource.manager.save(category3)

                const loadedCategories1 = await dataSource
                    .getRepository(Category)
                    .find({
                        where: {
                            name: "Bears",
                        },
                    })

                expect(loadedCategories1).to.be.eql([
                    {
                        id: 1,
                        name: "Bears",
                    },
                ])

                const loadedCategories2 = await dataSource
                    .getRepository(Category)
                    .find({
                        where: [
                            {
                                name: "Bears",
                            },
                            {
                                name: "Cats",
                            },
                        ],
                        order: { id: "ASC" },
                    })

                expect(loadedCategories2).to.be.eql([
                    {
                        id: 1,
                        name: "Bears",
                    },
                    {
                        id: 3,
                        name: "Cats",
                    },
                ])
            }),
        ))
})

describe("repository > find options > comment", () => {
    let dataSources: DataSource[]
    const logPath = "find_comment_test.log"

    before(async () => {
        // TODO: would be nice to be able to do this in memory with some kind of
        // test logger that buffers messages.
        const logger = new FileLogger(["query"], { logPath })
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            createLogger: () => logger,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(async () => {
        await closeTestingConnections(dataSources)
        try {
            await fs.unlink(logPath)
        } catch {}
    })

    it("repository should insert comment", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(User)
                    .find({ comment: "This is a query comment." })

                const logs = await fs.readFile(logPath)
                const lines = logs.toString().split("\n")
                const lastLine = lines[lines.length - 2] // last line is blank after newline
                // remove timestamp and prefix
                const sql = lastLine.replace(/^.*\[QUERY\]: /, "")
                expect(sql).to.match(/^\/\* This is a query comment. \*\//)
            }),
        ))
})

describe("repository > find options > cache", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            cache: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("repository should cache results properly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // first prepare data - insert users
                const user1 = new User()
                user1.name = "Harry"
                await dataSource.manager.save(user1)

                const user2 = new User()
                user2.name = "Ron"
                await dataSource.manager.save(user2)

                const user3 = new User()
                user3.name = "Hermione"
                await dataSource.manager.save(user3)

                // select for the first time with caching enabled
                const users1 = await dataSource
                    .getRepository(User)
                    .find({ cache: true })

                expect(users1.length).to.be.equal(3)

                // insert new entity
                const user4 = new User()
                user4.name = "Ginny"
                await dataSource.manager.save(user4)

                // without cache it must return really how many there entities are
                const users2 = await dataSource.getRepository(User).find()

                expect(users2.length).to.be.equal(4)

                // but with cache enabled it must not return newly inserted entity since cache is not expired yet
                const users3 = await dataSource
                    .getRepository(User)
                    .find({ cache: true })
                expect(users3.length).to.be.equal(3)

                // give some time for cache to expire
                await scheduler.wait(1010)

                // now, when our cache has expired we check if we have new user inserted even with cache enabled
                const users4 = await dataSource
                    .getRepository(User)
                    .find({ cache: true })
                expect(users4.length).to.be.equal(4)
            }),
        ))
})
