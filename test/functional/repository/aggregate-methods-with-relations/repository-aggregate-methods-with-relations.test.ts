import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src"
import { Post } from "./entity/Post"
import { Author } from "./entity/Author"
import { expect } from "chai"

describe("repository > aggregate methods with relations", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    describe("sum with relation filter", () => {
        it("should return the aggregate sum when filtering by relation", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const authorRepo = connection.getRepository(Author)
                    const postRepo = connection.getRepository(Post)

                    const author1 = await authorRepo.save({
                        name: "Author 1",
                    })
                    const author2 = await authorRepo.save({
                        name: "Author 2",
                    })

                    await postRepo.save([
                        { title: "Post 1", viewCount: 100, author: author1 },
                        { title: "Post 2", viewCount: 200, author: author1 },
                        { title: "Post 3", viewCount: 300, author: author2 },
                    ])

                    const sum = await postRepo.sum("viewCount", {
                        author: { id: author1.id },
                    })

                    expect(sum).to.equal(300)
                }),
            ))

        it("should return null when no records match relation filter", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const authorRepo = connection.getRepository(Author)
                    const postRepo = connection.getRepository(Post)

                    const author1 = await authorRepo.save({
                        name: "Author 1",
                    })

                    const sum = await postRepo.sum("viewCount", {
                        author: { id: author1.id },
                    })

                    expect(sum).to.be.equal(null)
                }),
            ))
    })

    describe("average with relation filter", () => {
        it("should return the aggregate average when filtering by relation", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const authorRepo = connection.getRepository(Author)
                    const postRepo = connection.getRepository(Post)

                    const author1 = await authorRepo.save({
                        name: "Author 1",
                    })
                    const author2 = await authorRepo.save({
                        name: "Author 2",
                    })

                    await postRepo.save([
                        { title: "Post 1", viewCount: 100, author: author1 },
                        { title: "Post 2", viewCount: 200, author: author1 },
                        { title: "Post 3", viewCount: 300, author: author2 },
                    ])

                    const average = await postRepo.average("viewCount", {
                        author: { id: author1.id },
                    })

                    expect(average).to.equal(150)
                }),
            ))

        it("should return null when no records match relation filter", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const authorRepo = connection.getRepository(Author)
                    const postRepo = connection.getRepository(Post)

                    const author1 = await authorRepo.save({
                        name: "Author 1",
                    })

                    const average = await postRepo.average("viewCount", {
                        author: { id: author1.id },
                    })

                    expect(average).to.be.equal(null)
                }),
            ))
    })

    describe("minimum with relation filter", () => {
        it("should return the aggregate minimum when filtering by relation", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const authorRepo = connection.getRepository(Author)
                    const postRepo = connection.getRepository(Post)

                    const author1 = await authorRepo.save({
                        name: "Author 1",
                    })
                    const author2 = await authorRepo.save({
                        name: "Author 2",
                    })

                    await postRepo.save([
                        { title: "Post 1", viewCount: 100, author: author1 },
                        { title: "Post 2", viewCount: 200, author: author1 },
                        { title: "Post 3", viewCount: 50, author: author2 },
                    ])

                    const minimum = await postRepo.minimum("viewCount", {
                        author: { id: author1.id },
                    })

                    expect(minimum).to.equal(100)
                }),
            ))

        it("should return null when no records match relation filter", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const authorRepo = connection.getRepository(Author)
                    const postRepo = connection.getRepository(Post)

                    const author1 = await authorRepo.save({
                        name: "Author 1",
                    })

                    const minimum = await postRepo.minimum("viewCount", {
                        author: { id: author1.id },
                    })

                    expect(minimum).to.be.equal(null)
                }),
            ))
    })

    describe("maximum with relation filter", () => {
        it("should return the aggregate maximum when filtering by relation", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const authorRepo = connection.getRepository(Author)
                    const postRepo = connection.getRepository(Post)

                    const author1 = await authorRepo.save({
                        name: "Author 1",
                    })
                    const author2 = await authorRepo.save({
                        name: "Author 2",
                    })

                    await postRepo.save([
                        { title: "Post 1", viewCount: 100, author: author1 },
                        { title: "Post 2", viewCount: 200, author: author1 },
                        { title: "Post 3", viewCount: 500, author: author2 },
                    ])

                    const maximum = await postRepo.maximum("viewCount", {
                        author: { id: author1.id },
                    })

                    expect(maximum).to.equal(200)
                }),
            ))

        it("should return null when no records match relation filter", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const authorRepo = connection.getRepository(Author)
                    const postRepo = connection.getRepository(Post)

                    const author1 = await authorRepo.save({
                        name: "Author 1",
                    })

                    const maximum = await postRepo.maximum("viewCount", {
                        author: { id: author1.id },
                    })

                    expect(maximum).to.be.equal(null)
                }),
            ))
    })

    describe("count with relation filter", () => {
        it("should return the aggregate count when filtering by relation", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const authorRepo = connection.getRepository(Author)
                    const postRepo = connection.getRepository(Post)

                    const author1 = await authorRepo.save({
                        name: "Author 1",
                    })
                    const author2 = await authorRepo.save({
                        name: "Author 2",
                    })

                    await postRepo.save([
                        { title: "Post 1", viewCount: 100, author: author1 },
                        { title: "Post 2", viewCount: 200, author: author1 },
                        { title: "Post 3", viewCount: 300, author: author2 },
                    ])

                    const count = await postRepo.count(["author"], {
                        where: { author: { id: author1.id } },
                        distinct: false,
                    })
                    expect(count).to.equal(2)

                    const count2 = await postRepo.count(["author"], {
                        where: { author: { id: author1.id } },
                        distinct: true,
                    })
                    expect(count2).to.equal(1)
                }),
            ))
        it("should return null when no records match relation filter", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const authorRepo = connection.getRepository(Author)
                    const postRepo = connection.getRepository(Post)

                    const author1 = await authorRepo.save({
                        name: "Author 1",
                    })

                    const count = await postRepo.count(["author"], {
                        where: { author: { id: author1.id } },
                    })
                    expect(count).to.equal(0)
                }),
            ))
    })

    describe("aggregate methods with nested relation filters", () => {
        it("should handle complex relation filters correctly", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const authorRepo = connection.getRepository(Author)
                    const postRepo = connection.getRepository(Post)

                    const author1 = await authorRepo.save({
                        name: "John Doe",
                    })
                    const author2 = await authorRepo.save({
                        name: "Jane Smith",
                    })

                    await postRepo.save([
                        { title: "Post 1", viewCount: 100, author: author1 },
                        { title: "Post 2", viewCount: 200, author: author1 },
                        { title: "Post 3", viewCount: 300, author: author2 },
                    ])

                    // Filter by both relation id and relation property
                    const sum = await postRepo.sum("viewCount", {
                        author: { id: author1.id, name: "John Doe" },
                    })

                    expect(sum).to.equal(300)
                }),
            ))
    })

    describe("aggregate methods with multiple tables having same column name", () => {
        it("should correctly qualify column names to avoid ambiguous references", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const authorRepo = connection.getRepository(Author)
                    const postRepo = connection.getRepository(Post)

                    const author1 = await authorRepo.save({
                        name: "Author 1",
                    })
                    const author2 = await authorRepo.save({
                        name: "Author 2",
                    })

                    await postRepo.save([
                        { title: "Post 1", viewCount: 100, author: author1 },
                        { title: "Post 2", viewCount: 200, author: author1 },
                        { title: "Post 3", viewCount: 300, author: author2 },
                    ])

                    // Both Post and Author have 'id' column - this should not cause ambiguous column error
                    const maxId = await postRepo.maximum("id", {
                        author: { id: author1.id },
                    })

                    expect(maxId).to.be.a("number")
                    expect(maxId).to.be.greaterThan(0)

                    // Verify we got the correct max ID from author1's posts, not from author2 or any other table
                    const author1Posts = await postRepo.find({
                        where: { author: { id: author1.id } },
                        order: { id: "DESC" },
                    })
                    expect(maxId).to.equal(author1Posts[0].id)
                }),
            ))
    })
})
