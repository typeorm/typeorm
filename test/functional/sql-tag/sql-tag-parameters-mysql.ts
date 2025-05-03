import "reflect-metadata"
import { MysqlExample } from "./entity/MysqlExample"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"
import { DataSource } from "../../../src"

describe("sql tag parameters (mysql)", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [MysqlExample],
                enabledDrivers: ["mysql", "mariadb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should handle basic SQL tag parameters", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(MysqlExample)

                await repo.save({ id: "basic" })

                const [example] =
                    await connection.sql`SELECT * FROM example WHERE id = ${"basic"}`

                expect(example?.id).to.be.equal("basic")
            }),
        ))

    it("should handle multiple parameters in a single query", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(MysqlExample)

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
                const ids = examples.map((e: MysqlExample) => e.id)

                expect(examples).to.have.length(2)
                expect(ids).to.have.members(["first", "second"])
            }),
        ))

    // MySQL does not support WITH RECURSIVE in 5.x, so skip that test

    it("should handle SQL tag parameters with complex conditions and ordering", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(MysqlExample)

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
                const repo = connection.getRepository(MysqlExample)

                await repo.save([
                    { id: "null1", value: null },
                    { id: "null2", value: 10 },
                ])

                const examples = await connection.sql`
                    SELECT * FROM example WHERE value IS ${null}
                `

                const ids = examples.map((e: MysqlExample) => e.id)

                expect(examples).to.have.length(1)
                expect(ids).to.have.members(["null1"])
            }),
        ))

    it("should handle SQL tag parameters with boolean values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(MysqlExample)

                await repo.save([
                    { id: "true1", active: true },
                    { id: "false1", active: false },
                ])

                const value = true

                const examples = await connection.sql`
                    SELECT * FROM example WHERE active = ${value}
                `

                const ids = examples.map((e: MysqlExample) => e.id)

                expect(examples).to.have.length(1)
                expect(ids).to.have.members(["true1"])
            }),
        ))

    it("should handle SQL tag parameters with array values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(MysqlExample)

                await repo.save([
                    { id: "array1", tags: "tag1,tag2" },
                    { id: "array2", tags: "tag3,tag4" },
                    { id: "array3", tags: "tag5,tag6" },
                ])

                const examples = await connection.sql`
                    SELECT tags FROM example
                    WHERE id IN (${["array1", "array2"]})
                `

                const tags = examples.flatMap(
                    (e: MysqlExample) => e.tags?.split(",") ?? [],
                )

                expect(tags).to.have.members(["tag1", "tag2", "tag3", "tag4"])
            }),
        ))
})
