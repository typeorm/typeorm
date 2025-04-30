import "reflect-metadata"
import { Example } from "./entity/Example"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"
import { DataSource } from "../../../src"

describe("sql tag parameters (better-sqlite3)", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Example],
                enabledDrivers: ["better-sqlite3"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should handle basic SQL tag parameters", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(Example)

                await repo.save({ id: "basic" })

                const [example] =
                    await connection.sql`SELECT * FROM example WHERE id = ${"basic"}`

                expect(example?.id).to.be.equal("basic")
            }),
        ))

    it("should handle multiple parameters in a single query", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(Example)

                await repo.save([
                    { id: "first", name: "test1", value: 10 },
                    { id: "second", name: "test2", value: 20 },
                ])

                const examples = await connection.sql`
                    SELECT * FROM example
                    WHERE id IN (${["first", "second"]})
                    AND name LIKE ${"test%"}
                    AND value > ${5}
                `
                const ids = examples.map((e: Example) => e.id)

                expect(examples).to.have.length(2)
                expect(ids).to.have.members(["first", "second"])
            }),
        ))

    it("should handle complex SQL with nested queries and parameters", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(Example)

                await repo.save([
                    { id: "parent1", parentId: null, value: 100 },
                    { id: "child1", parentId: "parent1", value: 200 },
                    { id: "child2", parentId: "parent1", value: 300 },
                ])

                const parentId = "parent1"
                const minValue = 150
                const examples = await connection.sql`
                    WITH RECURSIVE children AS (
                        SELECT * FROM example WHERE id = ${parentId}
                        UNION ALL
                        SELECT e.* FROM example e
                        INNER JOIN children c ON e."parentId" = c.id
                        WHERE e.value > ${minValue}
                    )
                    SELECT * FROM children WHERE id != ${parentId}
                `
                const ids = examples.map((e: Example) => e.id)

                expect(examples).to.have.length(2)
                expect(ids).to.have.members(["child1", "child2"])
            }),
        ))

    it("should handle SQL tag parameters with complex conditions and ordering", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(Example)

                await repo.save([
                    { id: "test1", value: 10, name: "a" },
                    { id: "test2", value: 20, name: "b" },
                    { id: "test3", value: 30, name: "c" },
                ])

                const minValue = 15
                const maxValue = 25
                const namePattern = "b"
                const [example] = await connection.sql`SELECT * FROM example
                    WHERE value > ${minValue}
                    AND value < ${maxValue}
                    AND name LIKE ${namePattern}
                    ORDER BY value DESC`

                expect(example.id).to.equal("test2")
                expect(example.value).to.equal(20)
            }),
        ))

    it("should handle SQL tag parameters with NULL values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(Example)

                await repo.save([
                    { id: "null1", value: null },
                    { id: "null2", value: 10 },
                ])

                const examples = await connection.sql`
                    SELECT * FROM example WHERE value IS ${null}
                `

                const ids = examples.map((e: Example) => e.id)

                expect(examples).to.have.length(1)
                expect(ids).to.have.members(["null1"])
            }),
        ))

    it("should handle SQL tag parameters with boolean values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(Example)

                await repo.save([
                    { id: "true1", active: true },
                    { id: "false1", active: false },
                ])

                const value = 1

                const examples = await connection.sql`
                    SELECT * FROM example WHERE active = ${value}
                `

                const ids = examples.map((e: Example) => e.id)

                expect(examples).to.have.length(1)
                expect(ids).to.have.members(["true1"])
            }),
        ))

    it("should handle SQL tag parameters with date values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(Example)
                const now = new Date()
                const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
                const nowISO = now.toISOString()
                const yesterdayISO = yesterday.toISOString()

                await repo.save([
                    { id: "today", createdAt: nowISO },
                    { id: "yesterday", createdAt: yesterdayISO },
                ])

                const examples = await connection.sql`
                    SELECT * FROM example WHERE "createdAt" > ${yesterdayISO}
                `

                const ids = examples.map((e: Example) => e.id)

                expect(examples).to.have.length(1)
                expect(ids).to.have.members(["today"])
            }),
        ))

    it("should handle SQL tag parameters with array values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(Example)

                await repo.save([
                    { id: "array1", tags: "tag1,tag2" },
                    { id: "array2", tags: "tag3,tag4" },
                    { id: "array3", tags: "tag5,tag6" },
                ])

                const searchTags = ["tag1", "tag3"]

                const examples = await connection.sql`
                    SELECT * FROM example
                    WHERE (
                        SELECT COUNT(*) FROM (
                            SELECT value FROM json_each('["' || replace(tags, ',', '","') || '"]')
                        ) WHERE value IN (${searchTags})
                    ) > 0
                `

                const ids = examples.map((e: Example) => e.id)

                expect(examples).to.have.length(2)
                expect(ids).to.have.members(["array1", "array2"])
            }),
        ))
})
