import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import { DataSource } from "../../../src"
import { PostgresExample } from "./entity/PostgresExample"

describe("sql tag parameters (postgres)", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [PostgresExample],
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should handle basic SQL tag parameters", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(PostgresExample)

                await repo.save({ id: "basic" })

                const [example] =
                    await connection.sql`SELECT * FROM example WHERE id = ${"basic"}`

                expect(example?.id).to.be.equal("basic")
            }),
        ))

    it("should handle multiple parameters in a single query", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(PostgresExample)

                await repo.save([
                    { id: "first", name: "test1", value: 10 },
                    { id: "second", name: "test2", value: 20 },
                ])

                const examples = await connection.sql`
                    SELECT * FROM example
                    WHERE id = ANY(${["first", "second"]})
                    AND name LIKE ${"test%"}
                    AND value > ${5}
                `
                const ids = examples.map((e: PostgresExample) => e.id)

                expect(examples).to.have.length(2)
                expect(ids).to.be.deepEqualIgnoreUndefined(["first", "second"])
            }),
        ))

    it("should handle complex SQL with nested queries and parameters", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(PostgresExample)

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
                const ids = examples.map((e: PostgresExample) => e.id)

                expect(examples).to.have.length(2)
                expect(ids).to.be.deepEqualIgnoreUndefined(["child1", "child2"])
            }),
        ))

    it("should handle SQL tag parameters with complex conditions and ordering", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(PostgresExample)

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
                const repo = connection.getRepository(PostgresExample)

                await repo.save([
                    { id: "null1", value: null },
                    { id: "null2", value: 10 },
                ])

                const examples = await connection.sql`
                    SELECT * FROM example WHERE value IS ${null}
                `

                const ids = examples.map((e: PostgresExample) => e.id)

                expect(examples).to.have.length(1)
                expect(ids).to.be.deepEqualIgnoreUndefined(["null1"])
            }),
        ))

    it("should handle SQL tag parameters with boolean values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(PostgresExample)

                await repo.save([
                    { id: "true1", active: true },
                    { id: "false1", active: false },
                ])

                const examples = await connection.sql`
                    SELECT * FROM example WHERE active = ${true}
                `

                const ids = examples.map((e: PostgresExample) => e.id)

                expect(examples).to.have.length(1)
                expect(ids).to.be.deepEqualIgnoreUndefined(["true1"])
            }),
        ))

    it("should handle SQL tag parameters with complex array operations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(PostgresExample)

                await repo.save([
                    { id: "array1", tags: ["tag1", "tag2"] },
                    { id: "array2", tags: ["tag3", "tag4"] },
                    { id: "array3", tags: ["tag5", "tag6"] },
                ])

                const searchTags = ["tag1", "tag3"]

                const examples = await connection.sql`
                    SELECT * FROM example
                    WHERE EXISTS (
                        SELECT 1 FROM jsonb_array_elements_text(tags) AS tag
                        WHERE tag = ANY(${searchTags})
                    )
                `

                const ids = examples.map((e: PostgresExample) => e.id)

                expect(examples).to.have.length(2)
                expect(ids).to.be.deepEqualIgnoreUndefined(["array1", "array2"])
            }),
        ))
})
