import "reflect-metadata"
import "../../../utils/test-setup"
import { expect } from "chai"
import sinon from "sinon"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"
import { Photo } from "./entity/Photo"
import { Counters } from "./entity/Counters"
import { EntityPropertyNotFoundError } from "../../../../src/error/EntityPropertyNotFoundError"
import type { QueryRunner } from "../../../../src/query-runner/QueryRunner"
import { In } from "../../../../src/find-options/operator/In"
import type { FindManyOptions } from "../../../../src/find-options/FindManyOptions"
import { Post as CompositeKeyPost } from "../../query-builder/relation-id/one-to-many/multiple-pk/entity/Post"
import { Category as CompositeKeyCategory } from "../../query-builder/relation-id/one-to-many/multiple-pk/entity/Category"
import { PostCategory } from "../../view-entity/general/entity/PostCategory"

const spyQueries = async <T>(
    dataSource: DataSource,
    run: (queryRunner: QueryRunner) => Promise<T>,
): Promise<{ result: T; queries: string[] }> => {
    const queryRunner = dataSource.createQueryRunner()
    const querySpy = sinon.spy(queryRunner, "query")
    try {
        const result = await run(queryRunner)
        return {
            result,
            queries: querySpy.getCalls().map((call) => call.args[0]),
        }
    } finally {
        querySpy.restore()
        await queryRunner.release()
    }
}

describe("repository > find options > relations", () => {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // -------------------------------------------------------------------------
    // Setup
    // -------------------------------------------------------------------------

    beforeEach(() =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postUser = new User()
                postUser.name = "Timber"
                await dataSource.manager.save(postUser)
                const postCountersUser = new User()
                postCountersUser.name = "Post Counters Timber"
                await dataSource.manager.save(postCountersUser)
                const photoCountersUser = new User()
                photoCountersUser.name = "Photo Counters Timber"
                await dataSource.manager.save(photoCountersUser)
                const photoUser = new User()
                photoUser.name = "Photo Timber"
                await dataSource.manager.save(photoUser)

                const category1 = new Category()
                category1.name = "category1"
                await dataSource.manager.save(category1)
                const category2 = new Category()
                category2.name = "category2"
                await dataSource.manager.save(category2)

                const photo1 = new Photo()
                photo1.filename = "photo1.jpg"
                photo1.counters = new Counters()
                photo1.counters.stars = 2
                photo1.counters.commentCount = 19
                photo1.counters.author = photoCountersUser
                photo1.user = photoUser
                await dataSource.manager.save(photo1)
                const photo2 = new Photo()
                photo2.filename = "photo2.jpg"
                photo2.counters = new Counters()
                photo2.counters.stars = 3
                photo2.counters.commentCount = 20
                await dataSource.manager.save(photo2)
                const photo3 = new Photo()
                photo3.filename = "photo3.jpg"
                photo3.counters = new Counters()
                photo3.counters.stars = 4
                photo3.counters.commentCount = 21
                await dataSource.manager.save(photo3)

                const postCounters = new Counters()
                postCounters.commentCount = 1
                postCounters.author = postCountersUser
                postCounters.stars = 101

                const post = new Post()
                post.title = "About Timber"
                post.counters = postCounters
                post.user = postUser
                post.categories = [category1, category2]
                post.photos = [photo1, photo2, photo3]
                await dataSource.manager.save(post)
            }),
        ),
    )

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("should not any relations if they are not specified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const loadedPost = await dataSource
                    .getRepository(Post)
                    .findOneBy({
                        id: 1,
                    })
                loadedPost!.should.be.eql({
                    id: 1,
                    title: "About Timber",
                    counters: {
                        commentCount: 1,
                        stars: 101,
                    },
                })
            }),
        ))

    it("should load specified relations case 1", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const loadedPost = await dataSource
                    .getRepository(Post)
                    .findOne({
                        where: {
                            id: 1,
                        },
                        relations: {
                            photos: true,
                        },
                    })
                loadedPost!.id.should.be.equal(1)
                loadedPost!.title.should.be.equal("About Timber")
                loadedPost!.counters.commentCount.should.be.equal(1)
                loadedPost!.counters.stars.should.be.equal(101)
                loadedPost!.photos.should.deep.include({
                    id: 1,
                    filename: "photo1.jpg",
                    counters: {
                        stars: 2,
                        commentCount: 19,
                    },
                })
                loadedPost!.photos.should.deep.include({
                    id: 2,
                    filename: "photo2.jpg",
                    counters: {
                        stars: 3,
                        commentCount: 20,
                    },
                })
                loadedPost!.photos.should.deep.include({
                    id: 3,
                    filename: "photo3.jpg",
                    counters: {
                        stars: 4,
                        commentCount: 21,
                    },
                })
            }),
        ))

    it("should load specified relations case 2", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const loadedPost = await dataSource
                    .getRepository(Post)
                    .findOne({
                        where: {
                            id: 1,
                        },
                        relations: {
                            photos: true,
                            user: true,
                            categories: true,
                        },
                    })
                loadedPost!.id.should.be.equal(1)
                loadedPost!.title.should.be.equal("About Timber")
                loadedPost!.counters.commentCount.should.be.equal(1)
                loadedPost!.counters.stars.should.be.equal(101)
                loadedPost!.photos.should.deep.include({
                    id: 1,
                    filename: "photo1.jpg",
                    counters: {
                        stars: 2,
                        commentCount: 19,
                    },
                })
                loadedPost!.photos.should.deep.include({
                    id: 2,
                    filename: "photo2.jpg",
                    counters: {
                        stars: 3,
                        commentCount: 20,
                    },
                })
                loadedPost!.photos.should.deep.include({
                    id: 3,
                    filename: "photo3.jpg",
                    counters: {
                        stars: 4,
                        commentCount: 21,
                    },
                })
                loadedPost!.user.should.be.eql({
                    id: 1,
                    name: "Timber",
                })
                loadedPost!.categories.should.deep.include({
                    id: 1,
                    name: "category1",
                })
                loadedPost!.categories.should.deep.include({
                    id: 2,
                    name: "category2",
                })
            }),
        ))

    it("should load specified relations and their sub-relations case 1", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const loadedPost = await dataSource
                    .getRepository(Post)
                    .findOne({
                        where: {
                            id: 1,
                        },
                        relations: {
                            photos: {
                                user: true,
                            },
                            user: true,
                            categories: true,
                        },
                    })
                loadedPost!.id.should.be.equal(1)
                loadedPost!.title.should.be.equal("About Timber")
                loadedPost!.counters.commentCount.should.be.equal(1)
                loadedPost!.counters.stars.should.be.equal(101)
                loadedPost!.photos.should.deep.include({
                    id: 1,
                    filename: "photo1.jpg",
                    counters: {
                        stars: 2,
                        commentCount: 19,
                    },
                    user: {
                        id: 4,
                        name: "Photo Timber",
                    },
                })
                loadedPost!.photos.should.deep.include({
                    id: 2,
                    filename: "photo2.jpg",
                    counters: {
                        stars: 3,
                        commentCount: 20,
                    },
                    user: null,
                })
                loadedPost!.photos.should.deep.include({
                    id: 3,
                    filename: "photo3.jpg",
                    counters: {
                        stars: 4,
                        commentCount: 21,
                    },
                    user: null,
                })
                loadedPost!.user.should.be.eql({
                    id: 1,
                    name: "Timber",
                })
                loadedPost!.categories.should.deep.include({
                    id: 1,
                    name: "category1",
                })
                loadedPost!.categories.should.deep.include({
                    id: 2,
                    name: "category2",
                })
            }),
        ))

    it("should load specified relations and their sub-relations case 2", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const loadedPost = await dataSource
                    .getRepository(Post)
                    .findOne({
                        where: {
                            id: 1,
                        },
                        relations: {
                            photos: {
                                user: true,
                            },
                            user: true,
                            counters: {
                                author: true,
                            },
                        },
                    })
                loadedPost!.id.should.be.equal(1)
                loadedPost!.title.should.be.equal("About Timber")
                loadedPost!.counters.commentCount.should.be.equal(1)
                loadedPost!.counters.stars.should.be.equal(101)
                loadedPost!.photos.should.deep.include({
                    id: 1,
                    filename: "photo1.jpg",
                    counters: {
                        stars: 2,
                        commentCount: 19,
                    },
                    user: {
                        id: 4,
                        name: "Photo Timber",
                    },
                })
                loadedPost!.photos.should.deep.include({
                    id: 2,
                    filename: "photo2.jpg",
                    counters: {
                        stars: 3,
                        commentCount: 20,
                    },
                    user: null,
                })
                loadedPost!.photos.should.deep.include({
                    id: 3,
                    filename: "photo3.jpg",
                    counters: {
                        stars: 4,
                        commentCount: 21,
                    },
                    user: null,
                })
                loadedPost!.user.should.be.eql({
                    id: 1,
                    name: "Timber",
                })
                loadedPost!.counters.author.should.be.eql({
                    id: 2,
                    name: "Post Counters Timber",
                })
            }),
        ))

    it("should load specified relations and their sub-relations case 3", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const loadedPost = await dataSource
                    .getRepository(Post)
                    .findOne({
                        where: {
                            id: 1,
                        },
                        relations: {
                            photos: {
                                user: true,
                                counters: {
                                    author: true,
                                },
                            },
                            user: true,
                            counters: {
                                author: true,
                            },
                        },
                    })
                loadedPost!.id.should.be.equal(1)
                loadedPost!.title.should.be.equal("About Timber")
                loadedPost!.counters.commentCount.should.be.equal(1)
                loadedPost!.counters.stars.should.be.equal(101)
                loadedPost!.photos.should.deep.include({
                    id: 1,
                    filename: "photo1.jpg",
                    counters: {
                        stars: 2,
                        commentCount: 19,
                        author: {
                            id: 3,
                            name: "Photo Counters Timber",
                        },
                    },
                    user: {
                        id: 4,
                        name: "Photo Timber",
                    },
                })
                loadedPost!.photos.should.deep.include({
                    id: 2,
                    filename: "photo2.jpg",
                    counters: {
                        stars: 3,
                        commentCount: 20,
                        author: null,
                    },
                    user: null,
                })
                loadedPost!.photos.should.deep.include({
                    id: 3,
                    filename: "photo3.jpg",
                    counters: {
                        stars: 4,
                        commentCount: 21,
                        author: null,
                    },
                    user: null,
                })
                loadedPost!.user.should.be.eql({
                    id: 1,
                    name: "Timber",
                })
                loadedPost!.counters.author.should.be.eql({
                    id: 2,
                    name: "Post Counters Timber",
                })
            }),
        ))

    it("should throw error if specified relations were not found case 1", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(Post)
                    .findOne({
                        where: {
                            id: 1,
                        },
                        relations: {
                            // @ts-expect-error
                            photos2: true,
                        },
                    })
                    .should.eventually.be.rejectedWith(
                        EntityPropertyNotFoundError,
                    )
            }),
        ))

    it("should throw error if specified relations were not found case 2", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(Post)
                    .findOne({
                        where: {
                            id: 1,
                        },
                        relations: {
                            photos: true,
                            counters: {
                                // @ts-expect-error
                                author2: true,
                            },
                        },
                    })
                    .should.eventually.be.rejectedWith(
                        EntityPropertyNotFoundError,
                    )
            }),
        ))

    it("should throw error if specified relations were not found case 3", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(Post)
                    .findOne({
                        where: {
                            id: 1,
                        },
                        relations: {
                            photos: true,
                            // @ts-expect-error
                            counters2: {
                                author: true,
                            },
                        },
                    })
                    .should.eventually.be.rejectedWith(
                        EntityPropertyNotFoundError,
                    )
            }),
        ))

    it("should throw error if specified relations were not found case 4", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(Post)
                    .findOne({
                        where: {
                            id: 1,
                        },
                        relations: {
                            photos: {
                                user: {
                                    // @ts-expect-error
                                    haha: true,
                                },
                            },
                        },
                    })
                    .should.eventually.be.rejectedWith(
                        EntityPropertyNotFoundError,
                    )
            }),
        ))

    it("should throw error if specified relations were not found case 5", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(Post)
                    .findOne({
                        where: {
                            id: 1,
                        },
                        relations: {
                            // @ts-expect-error
                            questions: true,
                        },
                    })
                    .should.eventually.be.rejectedWith(
                        EntityPropertyNotFoundError,
                    )
            }),
        ))

    it("should throw error if specified relations were not found case 6", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(Post)
                    .findOne({
                        where: {
                            id: 1,
                        },
                        relations: {
                            // @ts-expect-error
                            questions: {
                                haha: true,
                            },
                        },
                    })
                    .should.eventually.be.rejectedWith(
                        EntityPropertyNotFoundError,
                    )
            }),
        ))

    describe("github issues > #5694 find one by primary key", () => {
        it("should load a one-to-many relation in a single query when the where fixes the primary key", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { result: post, queries } = await spyQueries(
                        dataSource,
                        (queryRunner) =>
                            queryRunner.manager.getRepository(Post).findOne({
                                where: { id: 1 },
                                relations: { photos: true },
                            }),
                    )

                    expect(queries).to.have.lengthOf(1)
                    expect(post!.id).to.equal(1)
                    expect(
                        post!.photos.map((photo) => photo.filename).sort(),
                    ).to.eql(["photo1.jpg", "photo2.jpg", "photo3.jpg"])
                }),
            ))

        it("should keep the paginated queries when the where does not fix the primary key", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { result: post, queries } = await spyQueries(
                        dataSource,
                        (queryRunner) =>
                            queryRunner.manager.findOne(Post, {
                                where: { title: "About Timber" },
                                relations: { photos: true },
                            }),
                    )
                    const { queries: paginatedQueries } = await spyQueries(
                        dataSource,
                        (queryRunner) =>
                            queryRunner.manager
                                .createQueryBuilder(Post, "Post")
                                .setFindOptions({
                                    where: { title: "About Timber" },
                                    relations: { photos: true },
                                    take: 1,
                                })
                                .getOne(),
                    )

                    expect(queries).to.have.lengthOf(2)
                    expect(queries[0]).to.match(/^SELECT DISTINCT/)
                    expect(queries).to.eql(paginatedQueries)
                    expect(post!.photos).to.have.lengthOf(3)
                }),
            ))

        it("should keep the paginated queries when the where lists several primary keys", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    for (const where of [
                        [{ id: 1 }, { id: 2 }],
                        { id: In([1, 2]) },
                    ]) {
                        const { result: post, queries } = await spyQueries(
                            dataSource,
                            (queryRunner) =>
                                queryRunner.manager.findOne(Post, {
                                    where,
                                    relations: { photos: true },
                                }),
                        )

                        expect(queries).to.have.lengthOf(2)
                        expect(post!.id).to.equal(1)
                        expect(post!.photos).to.have.lengthOf(3)
                    }
                }),
            ))

        it("should keep the paginated queries when skip is set and the where fixes the primary key", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const options: FindManyOptions<Post> = {
                        where: { id: 1 },
                        relations: { photos: true },
                        skip: 1,
                    }
                    const { result: post, queries } = await spyQueries(
                        dataSource,
                        (queryRunner) =>
                            queryRunner.manager.findOne(Post, options),
                    )
                    const { queries: paginatedQueries } = await spyQueries(
                        dataSource,
                        (queryRunner) =>
                            queryRunner.manager
                                .createQueryBuilder(Post, "Post")
                                .setFindOptions({ ...options, take: 1 })
                                .getOne(),
                    )

                    expect(post).to.equal(null)
                    expect(queries).to.eql(paginatedQueries)
                }),
            ))
    })
})

describe("repository > find options > relations > github issues > #5694 find one by composite primary key", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [
                CompositeKeyPost,
                CompositeKeyCategory,
                __dirname +
                    "/../../query-builder/relation-id/one-to-many/multiple-pk/entity/Image{.js,.ts}",
            ],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const savePostWithCategories = async (dataSource: DataSource) => {
        const post = new CompositeKeyPost()
        post.id = 1
        post.authorId = 1
        post.title = "About BMW"
        await dataSource.manager.save(post)

        for (let code = 1; code <= 2; code++) {
            const category = new CompositeKeyCategory()
            category.id = 1
            category.code = code
            category.name = `category #${code}`
            category.post = post
            await dataSource.manager.save(category)
        }
    }

    it("should load a one-to-many relation in a single query when the where fixes every primary column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await savePostWithCategories(dataSource)

                const { result: post, queries } = await spyQueries(
                    dataSource,
                    (queryRunner) =>
                        queryRunner.manager.findOne(CompositeKeyPost, {
                            where: { id: 1, authorId: 1 },
                            relations: { categories: true },
                        }),
                )

                expect(queries).to.have.lengthOf(1)
                expect(post!.categories).to.have.lengthOf(2)
            }),
        ))

    it("should keep the paginated queries when the where misses a primary column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await savePostWithCategories(dataSource)

                const { result: post, queries } = await spyQueries(
                    dataSource,
                    (queryRunner) =>
                        queryRunner.manager.findOne(CompositeKeyPost, {
                            where: { id: 1 },
                            relations: { categories: true },
                        }),
                )

                expect(queries).to.have.lengthOf(2)
                expect(post!.categories).to.have.lengthOf(2)
            }),
        ))
})

describe("repository > find options > relations > github issues > #5694 find one on an entity without primary columns", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [
                __dirname + "/../../view-entity/general/entity/*{.js,.ts}",
            ],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should keep limiting the query to one row", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { queries } = await spyQueries(
                    dataSource,
                    (queryRunner) =>
                        queryRunner.manager.findOneBy(PostCategory, { id: 1 }),
                )

                expect(queries).to.have.lengthOf(1)
                expect(queries[0]).to.match(/LIMIT 1|FETCH NEXT 1 ROWS ONLY/)
            }),
        ))
})
