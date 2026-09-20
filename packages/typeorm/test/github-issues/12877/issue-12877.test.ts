import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Post, Comment } from "./entities"

/**
 * Regression test for GitHub issue #12877.
 *
 * When skip/take is combined with a join, SelectQueryBuilder paginates through
 * a SELECT DISTINCT sub-query. Every ORDER BY column has to be part of that
 * DISTINCT select list. If one of those columns comes from a to-many join
 * (@OneToMany/@ManyToMany), each child row becomes its own distinct row —
 * so LIMIT counts child rows instead of root entities, and root entities
 * silently drop out of the page.
 *
 * Before the fix: take(10) with 1 parent having 5 children returns 6 posts.
 * After the fix: take(10) returns 10 posts (all matching parents).
 */
describe("github issues > #12877 take/skip should return correct entity count with to-many join ordering", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [Post, Comment],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should return the correct number of root entities when ordering by a to-many joined column", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const postRepo = connection.getRepository(Post)
                const commentRepo = connection.getRepository(Comment)

                // Create 10 posts with distinct createdAt values.
                // Post 1 (newest) has 5 comments. Posts 2-10 have 0 comments.
                // This configuration exposes the bug: without the fix, DISTINCT
                // on the joined column causes the parent with 5 children to be
                // counted as 5 rows, reducing the effective LIMIT.
                const baseTime = new Date("2024-01-01T12:00:00Z")
                const posts = Array.from({ length: 10 }, (_, i) => ({
                    id: i + 1,
                    createdAt: new Date(baseTime.getTime() + i * 86400000),
                }))
                await postRepo.save(posts)

                // Only the newest post (id=1) has comments
                const comments = Array.from({ length: 5 }, (_, i) => ({
                    id: i + 1,
                    createdAt: new Date(baseTime.getTime() + i * 1000),
                    postId: 1,
                }))
                await commentRepo.save(comments)

                // Query: order by post.createdAt DESC, then by comment.createdAt ASC
                // (comment is the to-many side, so each post with comments is multiplied)
                const [posts_result, count] = await postRepo
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.comments", "comment")
                    .orderBy("post.createdAt", "DESC")
                    .addOrderBy("comment.createdAt", "ASC")
                    .skip(0)
                    .take(10)
                    .getManyAndCount()

                // getManyAndCount() should return the correct page size and total count
                expect(posts_result.length).eq(10, "take(10) should return 10 posts")
                expect(count).eq(10, "count should be 10")

                // Verify the ordering is correct: newest post first
                expect(posts_result[0]).to.be.instanceOf(Post)
                expect(posts_result[0].id).eq(1, "Newest post should be first")
            }),
        ))

    it("should return correct page with skip when ordering by to-many joined column", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const postRepo = connection.getRepository(Post)
                const commentRepo = connection.getRepository(Comment)

                const baseTime = new Date("2024-01-01T12:00:00Z")
                const posts = Array.from({ length: 15 }, (_, i) => ({
                    id: i + 1,
                    createdAt: new Date(baseTime.getTime() + i * 86400000),
                }))
                await postRepo.save(posts)

                // Posts 1 and 2 have comments (newest = id 1)
                const comments = [
                    { id: 1, createdAt: new Date(baseTime.getTime()), postId: 1 },
                    { id: 2, createdAt: new Date(baseTime.getTime() + 1000), postId: 1 },
                    { id: 3, createdAt: new Date(baseTime.getTime()), postId: 2 },
                ]
                await commentRepo.save(comments)

                // Skip 5, take 5 — should return posts 6-10 (ids 6,7,8,9,10)
                const [posts_result, count] = await postRepo
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.comments", "comment")
                    .orderBy("post.createdAt", "DESC")
                    .addOrderBy("comment.createdAt", "ASC")
                    .skip(5)
                    .take(5)
                    .getManyAndCount()

                expect(posts_result.length).eq(5, "skip(5) take(5) should return 5 posts")
                expect(count).eq(15, "total count should be 15")
                // Verify ordering: should be posts 6-10 (newest first overall is 1, then 2... so skip 5 gives 6)
                expect(posts_result[0].id).eq(10, "First post after skip should be id 10")
            }),
        ))
})
