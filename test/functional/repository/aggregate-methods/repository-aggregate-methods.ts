import "reflect-metadata"
import {
    reloadTestingDatabases,
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { LessThan } from "../../../../src"
import { expect } from "chai"

describe("repository > aggregate methods", () => {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    // connect to db
    let connections: DataSource[] = []

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    describe("sum", () => {
        it("should return the aggregate sum", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const postRepository = connections[0].getRepository(Post)
                    for (let i = 0; i < 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.counter = i + 1
                        await postRepository.save(post)
                    }

                    const sum = await postRepository.sum("counter")
                    expect(sum).to.equal(5050)
                }),
            ))

        it("should return null when 0 rows match the query", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const postRepository = connections[0].getRepository(Post)
                    for (let i = 0; i < 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.counter = i + 1
                        await postRepository.save(post)
                    }

                    const sum = await postRepository.sum("counter", {
                        id: LessThan(0),
                    })
                    expect(sum).to.be.null
                }),
            ))
    })

    describe("average", () => {
        it("should return the aggregate average", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const postRepository = connections[0].getRepository(Post)
                    for (let i = 0; i < 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.counter = i + 1
                        await postRepository.save(post)
                    }

                    const average = await postRepository.average("counter")
                    expect(average).to.equal(50.5)
                }),
            ))

        it("should return null when 0 rows match the query", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const postRepository = connections[0].getRepository(Post)
                    for (let i = 0; i < 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.counter = i + 1
                        await postRepository.save(post)
                    }

                    const average = await postRepository.average("counter", {
                        id: LessThan(0),
                    })
                    expect(average).to.be.null
                }),
            ))
    })

    describe("minimum", () => {
        it("should return the aggregate minimum", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const postRepository = connections[0].getRepository(Post)
                    for (let i = 0; i < 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.counter = i + 1
                        await postRepository.save(post)
                    }

                    const minimum = await postRepository.minimum("counter")
                    expect(minimum).to.equal(1)
                }),
            ))

        it("should return null when 0 rows match the query", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const postRepository = connections[0].getRepository(Post)
                    for (let i = 0; i < 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.counter = i + 1
                        await postRepository.save(post)
                    }

                    const minimum = await postRepository.minimum("counter", {
                        id: LessThan(0),
                    })
                    expect(minimum).to.be.null
                }),
            ))
    })

    describe("maximum", () => {
        it("should return the aggregate maximum", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const postRepository = connections[0].getRepository(Post)
                    for (let i = 0; i < 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.counter = i + 1
                        await postRepository.save(post)
                    }

                    const maximum = await postRepository.maximum("counter")
                    expect(maximum).to.equal(100)
                }),
            ))

        it("should return null when 0 rows match the query", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const postRepository = connections[0].getRepository(Post)
                    for (let i = 0; i < 100; i++) {
                        const post = new Post()
                        post.id = i
                        post.counter = i + 1
                        await postRepository.save(post)
                    }

                    const maximum = await postRepository.maximum("counter", {
                        id: LessThan(0),
                    })
                    expect(maximum).to.be.null
                }),
            ))
    })
})
