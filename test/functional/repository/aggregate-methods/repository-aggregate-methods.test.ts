import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../src"
import { LessThan } from "../../../../src"
import { expect } from "chai"

describe("repository > aggregate methods", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            dropSchema: true,
        })

        await Promise.all(
            dataSources.map(async (dataSource) => {
                for (let i = 0; i < 100; i++) {
                    const post = new Post()
                    post.id = i
                    post.counter = i + 1
                    await dataSource.getRepository(Post).save(post)
                }
            }),
        )
    })

    afterAll(() => closeTestingConnections(dataSources))

    describe("sum", () => {
        it("should return the aggregate sum", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const sum = await dataSource
                        .getRepository(Post)
                        .sum("counter")
                    expect(sum).to.equal(5050)
                }),
            ))

        it("should return null when 0 rows match the query", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const sum = await dataSource
                        .getRepository(Post)
                        .sum("counter", { id: LessThan(0) })
                    expect(sum).to.be.null
                }),
            ))
    })

    describe("average", () => {
        it("should return the aggregate average", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const average = await dataSource
                        .getRepository(Post)
                        .average("counter")
                    // Some RDBMSs (e.g. SQL Server) will return an int when averaging an int column, so either
                    // answer is acceptable.
                    expect([50, 50.5]).to.include(average)
                }),
            ))

        it("should return null when 0 rows match the query", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const average = await dataSource
                        .getRepository(Post)
                        .average("counter", {
                            id: LessThan(0),
                        })
                    expect(average).to.be.null
                }),
            ))
    })

    describe("minimum", () => {
        it("should return the aggregate minimum", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const minimum = await dataSource
                        .getRepository(Post)
                        .minimum("counter")
                    expect(minimum).to.equal(1)
                }),
            ))

        it("should return null when 0 rows match the query", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const minimum = await dataSource
                        .getRepository(Post)
                        .minimum("counter", {
                            id: LessThan(0),
                        })
                    expect(minimum).to.be.null
                }),
            ))
    })

    describe("maximum", () => {
        it("should return the aggregate maximum", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const maximum = await dataSource
                        .getRepository(Post)
                        .maximum("counter")
                    expect(maximum).to.equal(100)
                }),
            ))

        it("should return null when 0 rows match the query", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const maximum = await dataSource
                        .getRepository(Post)
                        .maximum("counter", {
                            id: LessThan(0),
                        })
                    expect(maximum).to.be.null
                }),
            ))
    })
})
