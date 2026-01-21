import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"
import { Post } from "./entity/Post"
import { Comment } from "./entity/Comment"
import { DriverUtils } from "../../../../src/driver/DriverUtils"

describe("query builder > order-by", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should be always in right order(default order)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post1 = new Post()
                post1.myOrder = 1

                const post2 = new Post()
                post2.myOrder = 2
                await connection.manager.save([post1, post2])

                const loadedPost = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .getOne()

                expect(loadedPost!.myOrder).to.be.equal(2)
            }),
        ))

    it("should be always in right order(custom order)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post1 = new Post()
                post1.myOrder = 1

                const post2 = new Post()
                post2.myOrder = 2
                await connection.manager.save([post1, post2])

                const loadedPost = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .addOrderBy("post.myOrder", "ASC")
                    .getOne()

                expect(loadedPost!.myOrder).to.be.equal(1)
            }),
        ))

    it("should be always in right order(custom order)", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (!(connection.driver.options.type === "postgres"))
                    // NULLS FIRST / LAST only supported by postgres
                    return

                const post1 = new Post()
                post1.myOrder = 1

                const post2 = new Post()
                post2.myOrder = 2
                await connection.manager.save([post1, post2])

                const loadedPost1 = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .addOrderBy("post.myOrder", "ASC", "NULLS FIRST")
                    .getOne()

                expect(loadedPost1!.myOrder).to.be.equal(1)

                const loadedPost2 = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .addOrderBy("post.myOrder", "ASC", "NULLS LAST")
                    .getOne()

                expect(loadedPost2!.myOrder).to.be.equal(1)
            }),
        ))

    it("should be always in right order(custom order)", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (!DriverUtils.isMySQLFamily(connection.driver))
                    // IS NULL / IS NOT NULL only supported by mysql
                    return

                const post1 = new Post()
                post1.myOrder = 1

                const post2 = new Post()
                post2.myOrder = 2
                await connection.manager.save([post1, post2])

                const loadedPost1 = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .addOrderBy("post.myOrder IS NULL", "ASC")
                    .getOne()

                expect(loadedPost1!.myOrder).to.be.equal(1)

                const loadedPost2 = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .addOrderBy("post.myOrder IS NOT NULL", "ASC")
                    .getOne()

                expect(loadedPost2!.myOrder).to.be.equal(1)
            }),
        ))

    it("should be able to order by sql statement", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (!DriverUtils.isMySQLFamily(connection.driver)) return // DIV statement does not supported by all drivers

                const post1 = new Post()
                post1.myOrder = 1
                post1.num1 = 10
                post1.num2 = 5

                const post2 = new Post()
                post2.myOrder = 2
                post2.num1 = 10
                post2.num2 = 2
                await connection.manager.save([post1, post2])

                const loadedPost1 = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.num1 DIV post.num2")
                    .getOne()

                expect(loadedPost1!.num1).to.be.equal(10)
                expect(loadedPost1!.num2).to.be.equal(5)

                const loadedPost2 = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.num1 DIV post.num2", "DESC")
                    .getOne()

                expect(loadedPost2!.num1).to.be.equal(10)
                expect(loadedPost2!.num2).to.be.equal(2)
            }),
        ))

    it("should order by joined entity column using database column name without pagination", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const commentRepository = connection.getRepository(Comment)

                for (let i = 0; i < 5; i++) {
                    const post = new Post()
                    post.myOrder = i
                    await postRepository.save(post)

                    const comment = new Comment()
                    comment.text = `comment-${i}`
                    comment.postId = post.id
                    await commentRepository.save(comment)
                }

                const query = commentRepository
                    .createQueryBuilder("comment")
                    .leftJoinAndSelect("comment.post", "post")
                    .addOrderBy("post.created_at", "ASC")

                const result = await query.getMany()

                expect(result).to.have.lengthOf(5)
                expect(result[0].post).to.not.be.undefined
            }),
        ))

    it("should order by joined entity column using database column name with pagination", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const commentRepository = connection.getRepository(Comment)

                for (let i = 0; i < 20; i++) {
                    const post = new Post()
                    post.myOrder = i
                    await postRepository.save(post)

                    const comment = new Comment()
                    comment.text = `comment-${i}`
                    comment.postId = post.id
                    await commentRepository.save(comment)
                }

                const query = commentRepository
                    .createQueryBuilder("comment")
                    .leftJoinAndSelect("comment.post", "post")
                    .addOrderBy("post.created_at", "ASC")
                    .skip(0)
                    .take(10)

                const result = await query.getMany()

                expect(result).to.have.lengthOf(10)
                expect(result[0].post).to.not.be.undefined
            }),
        ))

    it("should order by joined entity column using property name without pagination", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const commentRepository = connection.getRepository(Comment)

                for (let i = 0; i < 5; i++) {
                    const post = new Post()
                    post.myOrder = i
                    await postRepository.save(post)

                    const comment = new Comment()
                    comment.text = `comment-${i}`
                    comment.postId = post.id
                    await commentRepository.save(comment)
                }

                const query = commentRepository
                    .createQueryBuilder("comment")
                    .leftJoinAndSelect("comment.post", "post")
                    .addOrderBy("post.createdAt", "ASC")

                const result = await query.getMany()

                expect(result).to.have.lengthOf(5)
                expect(result[0].post).to.not.be.undefined
            }),
        ))

    it("should order by joined entity column using property name with pagination", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const commentRepository = connection.getRepository(Comment)

                for (let i = 0; i < 20; i++) {
                    const post = new Post()
                    post.myOrder = i
                    await postRepository.save(post)

                    const comment = new Comment()
                    comment.text = `comment-${i}`
                    comment.postId = post.id
                    await commentRepository.save(comment)
                }

                const query = commentRepository
                    .createQueryBuilder("comment")
                    .leftJoinAndSelect("comment.post", "post")
                    .addOrderBy("post.createdAt", "ASC")
                    .skip(0)
                    .take(10)

                const result = await query.getMany()

                expect(result).to.have.lengthOf(10)
                expect(result[0].post).to.not.be.undefined
            }),
        ))
})
