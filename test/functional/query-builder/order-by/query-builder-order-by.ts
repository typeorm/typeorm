import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"
import { Post } from "./entity/Post"
import { DriverUtils } from "../../../../src/driver/DriverUtils"
import { Comment } from "./entity/Comment"

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

    it("should not throw when using leftJoin + orderBy with expression + take + getRawAndEntities", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Create test data
                const post1 = new Post()
                post1.myOrder = 1
                post1.num1 = 10
                post1.num2 = 5

                const post2 = new Post()
                post2.myOrder = 2
                post2.num1 = 15
                post2.num2 = 3

                const post3 = new Post()
                post3.myOrder = 3
                post3.num1 = 20
                post3.num2 = 4

                await connection.manager.save([post1, post2, post3])

                // Create some comments
                const comment1 = new Comment()
                comment1.text = "Comment 1"
                comment1.postId = post1.id

                const comment2 = new Comment()
                comment2.text = "Comment 2"
                comment2.postId = post2.id

                await connection.manager.save([comment1, comment2])

                // Create query builder with leftJoin, orderBy expression and take
                const queryBuilder = connection.manager
                    .createQueryBuilder(Post, "post")
                    .leftJoin("post.comments", "comment")
                    .orderBy("post.num1 + post.num2", "ASC")
                    .take(2)

                // This should not throw an error
                const result = await queryBuilder.getRawAndEntities()

                // Verify we get results
                expect(result).to.be.an("object")
                expect(result.entities).to.be.an("array")
                expect(result.raw).to.be.an("array")
                expect(result.entities.length).to.be.lessThanOrEqual(2)
            }),
        ))

    it("should work with different orderBy expressions and getRawAndEntities with leftJoin", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Create test data
                const post1 = new Post()
                post1.myOrder = 1
                post1.num1 = 10
                post1.num2 = 5

                await connection.manager.save(post1)

                const comment1 = new Comment()
                comment1.text = "Test comment"
                comment1.postId = post1.id

                await connection.manager.save(comment1)

                // Test with different expression types
                const expressions = [
                    "post.num1 + post.num2",
                    "post.num1 * post.num2",
                    "post.num1 - post.num2",
                    "post.myOrder + post.num1",
                ]

                for (const expression of expressions) {
                    const queryBuilder = connection.manager
                        .createQueryBuilder(Post, "post")
                        .leftJoin("post.comments", "comment")
                        .orderBy(expression, "DESC")
                        .take(1)

                    // Should not throw error for any expression
                    const result = await queryBuilder.getRawAndEntities()
                    expect(result.entities).to.be.an("array")
                    expect(result.raw).to.be.an("array")
                }
            }),
        ))
})
