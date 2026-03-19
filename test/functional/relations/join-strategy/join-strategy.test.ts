import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Author } from "./entity/Author"
import { Profile } from "./entity/Profile"
import { Category } from "./entity/Category"
import { Comment } from "./entity/Comment"
import { PostMeta } from "./entity/PostMeta"
import { SoftDeleteAuthor } from "./entity/SoftDeleteAuthor"

describe("relations > join strategy", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    /**
     * Creates two posts:
     * - "Full post": has all relations set (required + optional)
     * - "Minimal post": has only required relations, optional ones are NULL
     *
     * This allows tests to verify join behavior through result counts:
     * - LEFT JOIN on optional relation → returns both posts
     * - INNER JOIN on required relation → returns both posts
     * - If join type were wrong (INNER on optional) → only "Full post" returned
     */
    async function prepareData(dataSource: DataSource) {
        const author = new Author()
        author.name = "Timber"
        await dataSource.manager.save(author)

        const requiredProfile = new Profile()
        requiredProfile.bio = "Required profile"
        await dataSource.manager.save(requiredProfile)

        const optionalProfile = new Profile()
        optionalProfile.bio = "Optional profile"
        await dataSource.manager.save(optionalProfile)

        const requiredProfile2 = new Profile()
        requiredProfile2.bio = "Required profile 2"
        await dataSource.manager.save(requiredProfile2)

        const category = new Category()
        category.name = "TypeScript"
        await dataSource.manager.save(category)

        const softDeleteAuthor = new SoftDeleteAuthor()
        softDeleteAuthor.name = "Soft Author"
        await dataSource.manager.save(softDeleteAuthor)

        // Post 1: all relations set
        const fullPost = new Post()
        fullPost.title = "Full post"
        fullPost.requiredAuthor = author
        fullPost.optionalAuthor = author
        fullPost.eagerRequiredAuthor = author
        fullPost.eagerOptionalAuthor = author
        fullPost.requiredProfile = requiredProfile
        fullPost.optionalProfile = optionalProfile
        fullPost.categories = [category]
        fullPost.requiredSoftDeleteAuthor = softDeleteAuthor
        await dataSource.manager.save(fullPost)

        const comment = new Comment()
        comment.text = "Great post"
        comment.post = fullPost
        await dataSource.manager.save(comment)

        const meta = new PostMeta()
        meta.description = "Post metadata"
        meta.post = fullPost
        await dataSource.manager.save(meta)

        // Post 2: only required relations, optional ones are NULL
        const minimalPost = new Post()
        minimalPost.title = "Minimal post"
        minimalPost.requiredAuthor = author
        minimalPost.eagerRequiredAuthor = author
        minimalPost.requiredProfile = requiredProfile2
        minimalPost.requiredSoftDeleteAuthor = softDeleteAuthor
        // optionalAuthor, eagerOptionalAuthor, optionalProfile: NULL
        // no comments, no categories, no meta
        await dataSource.manager.save(minimalPost)
    }

    describe("ManyToOne", () => {
        describe("QueryBuilder", () => {
            it("should use INNER JOIN when nullable=false, eager=false", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const qb = dataSource
                            .getRepository(Post)
                            .createQueryBuilder("post")
                            .setFindOptions({
                                relations: { requiredAuthor: true },
                            })

                        expect(qb.getQuery()).to.match(
                            /INNER JOIN .?author.? .?post__post_requiredAuthor.?/,
                        )

                        const posts = await qb.getMany()
                        expect(posts).to.have.length(2)
                        expect(
                            posts.every(
                                (p) => p.requiredAuthor.name === "Timber",
                            ),
                        ).to.be.true
                    }),
                ))

            it("should use LEFT JOIN when nullable=true, eager=false", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const qb = dataSource
                            .getRepository(Post)
                            .createQueryBuilder("post")
                            .setFindOptions({
                                relations: { optionalAuthor: true },
                            })

                        expect(qb.getQuery()).to.match(
                            /LEFT JOIN .?author.? .?post__post_optionalAuthor.?/,
                        )

                        // LEFT JOIN returns both posts, even though minimal post has no optional author
                        const posts = await qb.getMany()
                        expect(posts).to.have.length(2)

                        const fullPost = posts.find(
                            (p) => p.title === "Full post",
                        )
                        const minimalPost = posts.find(
                            (p) => p.title === "Minimal post",
                        )
                        expect(fullPost?.optionalAuthor.name).to.equal("Timber")
                        expect(minimalPost?.optionalAuthor).to.be.null
                    }),
                ))

            it("should use INNER JOIN when nullable=false, eager=true", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const qb = dataSource
                            .getRepository(Post)
                            .createQueryBuilder("post")
                            .setFindOptions({})

                        expect(qb.getQuery()).to.match(
                            /INNER JOIN .?author.? .?post__eagerRequiredAuthor.?/,
                        )

                        const posts = await qb.getMany()
                        expect(posts).to.have.length(2)
                        expect(
                            posts.every(
                                (p) => p.eagerRequiredAuthor.name === "Timber",
                            ),
                        ).to.be.true
                    }),
                ))

            it("should use LEFT JOIN when nullable=true, eager=true", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const qb = dataSource
                            .getRepository(Post)
                            .createQueryBuilder("post")
                            .setFindOptions({})

                        expect(qb.getQuery()).to.match(
                            /LEFT JOIN .?author.? .?post__eagerOptionalAuthor.?/,
                        )

                        // LEFT JOIN returns both posts
                        const posts = await qb.getMany()
                        expect(posts).to.have.length(2)
                    }),
                ))
        })

        describe("find methods", () => {
            it("should return both posts when nullable=false (INNER JOIN keeps all rows)", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const posts = await dataSource
                            .getRepository(Post)
                            .find({ relations: { requiredAuthor: true } })

                        expect(posts).to.have.length(2)
                        expect(
                            posts.every(
                                (p) => p.requiredAuthor.name === "Timber",
                            ),
                        ).to.be.true
                    }),
                ))

            it("should return both posts when nullable=true (LEFT JOIN includes null rows)", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const posts = await dataSource
                            .getRepository(Post)
                            .find({ relations: { optionalAuthor: true } })

                        // LEFT JOIN must not filter out the minimal post
                        expect(posts).to.have.length(2)

                        const minimalPost = posts.find(
                            (p) => p.title === "Minimal post",
                        )
                        expect(minimalPost?.optionalAuthor).to.be.null
                    }),
                ))
        })
    })

    describe("OneToOne (owner side)", () => {
        describe("QueryBuilder", () => {
            it("should use INNER JOIN when nullable=false", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const qb = dataSource
                            .getRepository(Post)
                            .createQueryBuilder("post")
                            .setFindOptions({
                                relations: { requiredProfile: true },
                            })

                        expect(qb.getQuery()).to.match(
                            /INNER JOIN .?profile.? .?post__post_requiredProfile.?/,
                        )

                        const posts = await qb.getMany()
                        expect(posts).to.have.length(2)
                        expect(posts.every((p) => p.requiredProfile !== null))
                            .to.be.true
                    }),
                ))

            it("should use LEFT JOIN when nullable=true", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const qb = dataSource
                            .getRepository(Post)
                            .createQueryBuilder("post")
                            .setFindOptions({
                                relations: { optionalProfile: true },
                            })

                        expect(qb.getQuery()).to.match(
                            /LEFT JOIN .?profile.? .?post__post_optionalProfile.?/,
                        )

                        // LEFT JOIN returns both posts
                        const posts = await qb.getMany()
                        expect(posts).to.have.length(2)

                        const minimalPost = posts.find(
                            (p) => p.title === "Minimal post",
                        )
                        expect(minimalPost?.optionalProfile).to.be.null
                    }),
                ))
        })

        describe("find methods", () => {
            it("should return both posts when nullable=false (INNER JOIN keeps all rows)", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const posts = await dataSource
                            .getRepository(Post)
                            .find({ relations: { requiredProfile: true } })

                        expect(posts).to.have.length(2)
                        expect(posts.every((p) => p.requiredProfile !== null))
                            .to.be.true
                    }),
                ))

            it("should return both posts when nullable=true (LEFT JOIN includes null rows)", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const posts = await dataSource
                            .getRepository(Post)
                            .find({ relations: { optionalProfile: true } })

                        expect(posts).to.have.length(2)

                        const minimalPost = posts.find(
                            (p) => p.title === "Minimal post",
                        )
                        expect(minimalPost?.optionalProfile).to.be.null
                    }),
                ))
        })
    })

    describe("OneToOne (inverse side)", () => {
        describe("QueryBuilder", () => {
            it("should always use LEFT JOIN regardless of nullable", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const qb = dataSource
                            .getRepository(Post)
                            .createQueryBuilder("post")
                            .setFindOptions({
                                relations: { meta: true },
                            })

                        expect(qb.getQuery()).to.match(
                            /LEFT JOIN .?post_meta.? .?post__post_meta.?/,
                        )
                        expect(qb.getQuery()).to.not.match(
                            /INNER JOIN .?post_meta.?/,
                        )

                        // LEFT JOIN returns both posts even though minimal post has no meta
                        const posts = await qb.getMany()
                        expect(posts).to.have.length(2)

                        const minimalPost = posts.find(
                            (p) => p.title === "Minimal post",
                        )
                        expect(minimalPost?.meta).to.be.null
                    }),
                ))
        })

        describe("find methods", () => {
            it("should return both posts including one without inverse relation", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const posts = await dataSource
                            .getRepository(Post)
                            .find({ relations: { meta: true } })

                        expect(posts).to.have.length(2)

                        const fullPost = posts.find(
                            (p) => p.title === "Full post",
                        )
                        const minimalPost = posts.find(
                            (p) => p.title === "Minimal post",
                        )
                        expect(fullPost?.meta.description).to.equal(
                            "Post metadata",
                        )
                        expect(minimalPost?.meta).to.be.null
                    }),
                ))
        })
    })

    describe("OneToMany", () => {
        describe("QueryBuilder", () => {
            it("should always use LEFT JOIN regardless of nullable", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const qb = dataSource
                            .getRepository(Post)
                            .createQueryBuilder("post")
                            .setFindOptions({
                                relations: { comments: true },
                            })

                        expect(qb.getQuery()).to.match(
                            /LEFT JOIN .?comment.? .?post__post_comments.?/,
                        )
                        expect(qb.getQuery()).to.not.match(
                            /INNER JOIN .?comment.?/,
                        )

                        // LEFT JOIN returns both posts even though minimal post has no comments
                        const posts = await qb.getMany()
                        expect(posts).to.have.length(2)

                        const fullPost = posts.find(
                            (p) => p.title === "Full post",
                        )
                        const minimalPost = posts.find(
                            (p) => p.title === "Minimal post",
                        )
                        expect(fullPost?.comments).to.have.length(1)
                        expect(minimalPost?.comments).to.have.length(0)
                    }),
                ))
        })

        describe("find methods", () => {
            it("should return both posts including one without children", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const posts = await dataSource
                            .getRepository(Post)
                            .find({ relations: { comments: true } })

                        expect(posts).to.have.length(2)

                        const fullPost = posts.find(
                            (p) => p.title === "Full post",
                        )
                        const minimalPost = posts.find(
                            (p) => p.title === "Minimal post",
                        )
                        expect(fullPost?.comments).to.have.length(1)
                        expect(minimalPost?.comments).to.have.length(0)
                    }),
                ))
        })
    })

    describe("ManyToMany", () => {
        describe("QueryBuilder", () => {
            it("should always use LEFT JOIN regardless of nullable", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const qb = dataSource
                            .getRepository(Post)
                            .createQueryBuilder("post")
                            .setFindOptions({
                                relations: { categories: true },
                            })

                        expect(qb.getQuery()).to.not.match(
                            /INNER JOIN .?category.?/,
                        )

                        // LEFT JOIN returns both posts even though minimal post has no categories
                        const posts = await qb.getMany()
                        expect(posts).to.have.length(2)

                        const fullPost = posts.find(
                            (p) => p.title === "Full post",
                        )
                        const minimalPost = posts.find(
                            (p) => p.title === "Minimal post",
                        )
                        expect(fullPost?.categories).to.have.length(1)
                        expect(minimalPost?.categories).to.have.length(0)
                    }),
                ))
        })

        describe("find methods", () => {
            it("should return both posts including one without associations", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const posts = await dataSource
                            .getRepository(Post)
                            .find({ relations: { categories: true } })

                        expect(posts).to.have.length(2)

                        const fullPost = posts.find(
                            (p) => p.title === "Full post",
                        )
                        const minimalPost = posts.find(
                            (p) => p.title === "Minimal post",
                        )
                        expect(fullPost?.categories).to.have.length(1)
                        expect(minimalPost?.categories).to.have.length(0)
                    }),
                ))
        })
    })

    describe("soft-delete interaction", () => {
        describe("QueryBuilder", () => {
            it("should use LEFT JOIN when nullable=false but target has @DeleteDateColumn", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const qb = dataSource
                            .getRepository(Post)
                            .createQueryBuilder("post")
                            .setFindOptions({
                                relations: {
                                    requiredSoftDeleteAuthor: true,
                                },
                            })

                        // Should be LEFT JOIN despite nullable=false, because target has soft-delete
                        expect(qb.getQuery()).to.match(
                            /LEFT JOIN .?soft_delete_author.? .?post__post_requiredSoftDeleteAuthor.?/,
                        )

                        const posts = await qb.getMany()
                        expect(posts).to.have.length(2)
                    }),
                ))

            it("should preserve parent rows when related soft-deleted entity is soft-deleted", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        // Soft-delete the author
                        await dataSource
                            .getRepository(SoftDeleteAuthor)
                            .softDelete({ name: "Soft Author" })

                        // Parent posts should still be returned (LEFT JOIN preserves them)
                        const posts = await dataSource
                            .getRepository(Post)
                            .find({
                                relations: {
                                    requiredSoftDeleteAuthor: true,
                                },
                            })

                        expect(posts).to.have.length(2)
                        // The soft-deleted author should be null (filtered by IS NULL condition)
                        expect(
                            posts.every(
                                (p) => p.requiredSoftDeleteAuthor === null,
                            ),
                        ).to.be.true
                    }),
                ))

            it("should use INNER JOIN when nullable=false with @DeleteDateColumn and withDeleted=true", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        const qb = dataSource
                            .getRepository(Post)
                            .createQueryBuilder("post")
                            .setFindOptions({
                                withDeleted: true,
                                relations: {
                                    requiredSoftDeleteAuthor: true,
                                },
                            })

                        // With withDeleted=true, soft-delete is ignored, so INNER JOIN is safe
                        expect(qb.getQuery()).to.match(
                            /INNER JOIN .?soft_delete_author.? .?post__post_requiredSoftDeleteAuthor.?/,
                        )

                        const posts = await qb.getMany()
                        expect(posts).to.have.length(2)
                    }),
                ))
        })

        describe("find methods", () => {
            it("should preserve parent rows when related entity is soft-deleted", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await prepareData(dataSource)

                        // Soft-delete the author
                        await dataSource
                            .getRepository(SoftDeleteAuthor)
                            .softDelete({ name: "Soft Author" })

                        const posts = await dataSource
                            .getRepository(Post)
                            .find({
                                relations: {
                                    requiredSoftDeleteAuthor: true,
                                },
                            })

                        expect(posts).to.have.length(2)
                        expect(
                            posts.every(
                                (p) => p.requiredSoftDeleteAuthor === null,
                            ),
                        ).to.be.true
                    }),
                ))
        })
    })
})
