import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("query builder > convert raw results to entity", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // Regression for #11421: a partial selection can contain only null values.
    it("should return an entity when all selected columns are null", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Post)
                await repository.save({ id: 1 })

                const post = await repository.findOne({
                    where: { id: 1 },
                    select: { isNew: true },
                })

                expect(post).to.deep.equal({ isNew: null })
            }),
        ))

    it("should not create entities when only raw expressions are selected", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Post)
                await repository.save({ id: 1 })

                const result = await repository
                    .createQueryBuilder("post")
                    .select("post.id + 0", "post_id")
                    .getRawAndEntities()

                expect(result.raw).to.have.length(1)
                expect(result.entities).to.be.empty
            }),
        ))

    it("should keep separate entities when all selected columns are null", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Post)
                await repository.save([{ id: 1 }, { id: 2 }])

                const posts = await repository
                    .createQueryBuilder("post")
                    .select("post.isNew")
                    .orderBy("post.id")
                    .getMany()

                expect(posts).to.deep.equal([{ isNew: null }, { isNew: null }])
            }),
        ))

    it("should distinguish an all-null joined entity from a missing join", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Post)
                await repository.save([{ id: 1 }, { id: 2 }])

                const posts = await repository
                    .createQueryBuilder("post")
                    .leftJoinAndMapOne(
                        "post.nextPost",
                        Post,
                        "nextPost",
                        "nextPost.id = post.id + 1",
                    )
                    .select(["post.isNew", "nextPost.isNew"])
                    .orderBy("post.id")
                    .getMany()

                expect(posts).to.deep.equal([
                    { isNew: null, nextPost: { isNew: null } },
                    { isNew: null, nextPost: null },
                ])
            }),
        ))

    it("should return null value in entity property when record column is null", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)
                const post = new Post()
                post.id = 1

                await postRepository.save(post)

                const loadedPost = await postRepository.findOneBy({ id: 1 })
                if (loadedPost) {
                    expect(loadedPost.isNew).to.be.equal(null)
                }
            }),
        ))

    it("should return true in entity property when record column is true", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)
                const post = new Post()
                post.id = 1
                post.isNew = true

                await postRepository.save(post)

                const loadedPost = await postRepository.findOneBy({ id: 1 })
                if (loadedPost) {
                    expect(loadedPost.isNew).to.be.equal(true)
                }
            }),
        ))

    it("should return false in entity property when record column is false", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)
                const post = new Post()
                post.id = 1
                post.isNew = false

                await postRepository.save(post)

                const loadedPost = await postRepository.findOneBy({ id: 1 })
                if (loadedPost) {
                    expect(loadedPost.isNew).to.be.equal(false)
                }
            }),
        ))
})
