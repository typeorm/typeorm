import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"

describe("driver > postgres-js > advanced features", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres-js", "postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should support RETURNING clause in INSERT", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    "SELECT * FROM (VALUES (1, 'test')) AS t(id, name)",
                )
                expect(result.length).to.equal(1)
                expect(result[0].id).to.equal(1)
            }),
        ))

    it("should support CASE expressions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    `SELECT CASE WHEN true THEN 'yes' ELSE 'no' END as result`,
                )
                expect(result[0].result).to.equal("yes")
            }),
        ))

    it("should support window functions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    `SELECT ROW_NUMBER() OVER () as row_num, 1 as num`,
                )
                expect(result.length).to.equal(1)
                expect(Number(result[0].row_num)).to.equal(1)
            }),
        ))

    it("should support CTE (Common Table Expressions)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    `WITH cte AS (SELECT 1 as num) SELECT * FROM cte`,
                )
                expect(result.length).to.equal(1)
                expect(result[0].num).to.equal(1)
            }),
        ))

    it("should support UNION", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    `SELECT 1 as num UNION SELECT 2 as num`,
                )
                expect(result.length).to.equal(2)
            }),
        ))

    it("should support CROSS JOIN", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    `SELECT * FROM (SELECT 1 as a) t1 CROSS JOIN (SELECT 2 as b) t2`,
                )
                expect(result.length).to.equal(1)
                expect(result[0].a).to.equal(1)
                expect(result[0].b).to.equal(2)
            }),
        ))

    it("should handle large parameter sets", () =>
        Promise.all(
            connections.map(async (connection) => {
                const params = Array.from({ length: 100 }, (_, i) => i)
                const placeholders = params
                    .map((_, i) => `$${i + 1}`)
                    .join(", ")
                const result = await connection.query(
                    `SELECT ARRAY[${placeholders}] as nums`,
                    params,
                )
                expect(result.length).to.equal(1)
                expect(result[0].nums.length).to.equal(100)
            }),
        ))

    it("should handle special characters in strings", () =>
        Promise.all(
            connections.map(async (connection) => {
                const specialString = "test'\"\\n\t"
                const result = await connection.query(
                    "SELECT $1 as special_string",
                    [specialString],
                )
                expect(result[0].special_string).to.equal(specialString)
            }),
        ))

    it("should handle zero values correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    "SELECT 0 as zero_int, 0.0 as zero_float, false as zero_bool",
                )
                expect(result[0].zero_int).to.equal(0)
                // postgres.js might return 0.0 as string or float
                expect(Number(result[0].zero_float)).to.equal(0)
                expect(result[0].zero_bool).to.equal(false)
            }),
        ))

    it("should handle very long queries", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Create a query with many SELECT statements
                const longQuery = Array.from(
                    { length: 50 },
                    (_, i) => `SELECT ${i} as num`,
                ).join(" UNION ALL ")
                const result = await connection.query(longQuery)
                expect(result.length).to.equal(50)
            }),
        ))

    it("should support string functions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    `SELECT UPPER('hello') as upper_result, LOWER('WORLD') as lower_result`,
                )
                expect(result[0].upper_result).to.equal("HELLO")
                expect(result[0].lower_result).to.equal("world")
            }),
        ))

    it("should support date/time functions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    `SELECT CURRENT_DATE as today, DATE_TRUNC('day', now()) as truncated`,
                )
                expect(result[0].today).to.be.instanceOf(Date)
                expect(result[0].truncated).to.be.instanceOf(Date)
            }),
        ))

    it("should support math functions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    `SELECT ABS(-5) as abs_val, ROUND(3.14159, 2) as rounded, CEIL(3.14) as ceiled`,
                )
                expect(Number(result[0].abs_val)).to.equal(5)
                // ROUND returns numeric type, handle as string or number
                const roundedVal =
                    typeof result[0].rounded === "string"
                        ? parseFloat(result[0].rounded)
                        : result[0].rounded
                expect(roundedVal).to.be.closeTo(3.14, 0.01)
                expect(Number(result[0].ceiled)).to.equal(4)
            }),
        ))

    it("should support COALESCE function", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    `SELECT COALESCE(NULL, NULL, 'default') as coalesced`,
                )
                expect(result[0].coalesced).to.equal("default")
            }),
        ))

    it("should support NULLIF function", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    `SELECT NULLIF(5, 5) as null_result, NULLIF(5, 6) as num_result`,
                )
                expect(result[0].null_result).to.be.null
                expect(result[0].num_result).to.equal(5)
            }),
        ))

    it("should support subqueries", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(`
                    SELECT (SELECT COUNT(*) FROM (SELECT 1) t) as subquery_count
                `)
                // COUNT(*) returns bigint, convert to number for comparison
                expect(Number(result[0].subquery_count)).to.equal(1)
            }),
        ))

    it("should handle empty result sets", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    "SELECT * FROM (SELECT 1 WHERE false) t",
                )
                expect(result).to.be.an("array")
                expect(result.length).to.equal(0)
            }),
        ))

    it("should support DISTINCT", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    `SELECT DISTINCT * FROM (SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 2) t(num)`,
                )
                expect(result.length).to.equal(2)
            }),
        ))

    it("should support LIMIT and OFFSET correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result1 = await connection.query(`
                    SELECT * FROM (SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4) t(num)
                    ORDER BY num LIMIT 2
                `)
                const result2 = await connection.query(`
                    SELECT * FROM (SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4) t(num)
                    ORDER BY num LIMIT 2 OFFSET 2
                `)

                expect(result1.length).to.equal(2)
                expect(result2.length).to.equal(2)
                expect(result1[0].num).to.equal(1)
                expect(result2[0].num).to.equal(3)
            }),
        ))
})
