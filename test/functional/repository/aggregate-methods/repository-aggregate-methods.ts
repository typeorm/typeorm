import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { Repository } from "../../../../src"
import { DataSource } from "../../../../src"
import { Post } from "./entity/Post"
import { LessThan } from "../../../../src"
import { expect } from "chai"

describe("repository > aggregate methods", () => {
    debugger
    let connections: DataSource[]
    let repository: Repository<Post>

    before(async () => {
        connections = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            dropSchema: true,
        })
        repository = connections[0].getRepository(Post)
        for (let i = 0; i < 100; i++) {
            const post = new Post()
            post.id = i
            post.counter = i + 1
            await repository.save(post)
        }
    })

    after(() => closeTestingConnections(connections))

    describe("sum", () => {
        it("should return the aggregate sum", async () => {
            const sum = await repository.sum("counter")
            expect(sum).to.equal(5050)
        })

        it("should return null when 0 rows match the query", async () => {
            const sum = await repository.sum("counter", { id: LessThan(0) })
            expect(sum).to.be.null
        })
    })

    describe("average", () => {
        it("should return the aggregate average", async () => {
            const average = await repository.average("counter")
            // Some RDBMSs (e.g. SQL Server) will return an int when averaging an int column, so either
            // answer is acceptable.
            expect([50, 50.5]).to.include(average)
        })

        it("should return null when 0 rows match the query", async () => {
            const average = await repository.average("counter", {
                id: LessThan(0),
            })
            expect(average).to.be.null
        })
    })

    describe("minimum", () => {
        it("should return the aggregate minimum", async () => {
            const minimum = await repository.minimum("counter")
            expect(minimum).to.equal(1)
        })

        it("should return null when 0 rows match the query", async () => {
            const minimum = await repository.minimum("counter", {
                id: LessThan(0),
            })
            expect(minimum).to.be.null
        })
    })

    describe("maximum", () => {
        it("should return the aggregate maximum", async () => {
            const maximum = await repository.maximum("counter")
            expect(maximum).to.equal(100)
        })

        it("should return null when 0 rows match the query", async () => {
            const maximum = await repository.maximum("counter", {
                id: LessThan(0),
            })
            expect(maximum).to.be.null
        })
    })
})
