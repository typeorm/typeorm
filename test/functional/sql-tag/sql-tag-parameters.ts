import { expect } from "chai"
import "reflect-metadata"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { buildSqlTag } from "../../../src/util/SqlTagUtils"

describe.only("sql tag parameters", () => {
    function sql(strings: TemplateStringsArray, ...expressions: unknown[]) {
        return buildSqlTag({
            driver: new PostgresDriver(),
            strings,
            expressions,
        })
    }

    it("should handle basic SQL tag parameters", () => {
        const { query, parameters } = sql`
            SELECT * FROM example
        `

        expect(query).to.equal("SELECT * FROM example")
        expect(parameters).to.deep.equal([])
    })

    it("should handle with multiple parameters", () => {
        const ids = ["first", "second"]
        const name = "test"
        const { query, parameters } = sql`
            SELECT * FROM example WHERE id = ANY(${ids}) AND name = ${name}
        `

        expect(query).to.equal(
            "SELECT * FROM example WHERE id = ANY($1) AND name = $2",
        )
        expect(parameters).to.deep.equal([["first", "second"], "test"])
    })

    it("should spread an array when it's called with a function", () => {
        const { query, parameters } = sql`
            SELECT * FROM example WHERE id = ANY(${() => ["first", "second"]})
        `

        expect(query).to.equal("SELECT * FROM example WHERE id = ANY($1, $2)")
        expect(parameters).to.deep.equal(["first", "second"])
    })

    it("should keep incrementing the parameter index after an array is spread", () => {
        const ids = ["first", "second"]
        const name = "test"
        const { query, parameters } = sql`
            SELECT * FROM example WHERE id = ANY(${() =>
                ids}) AND name = ${name}
        `

        expect(query).to.equal(
            "SELECT * FROM example WHERE id = ANY($1, $2) AND name = $3",
        )
        expect(parameters).to.deep.equal(["first", "second", "test"])
    })

    it("should handle an empty array spread", () => {
        const { query, parameters } = sql`
            SELECT * FROM example WHERE id = ANY(${() => []})
        `

        expect(query).to.equal("SELECT * FROM example WHERE id = ANY(NULL)")
        expect(parameters).to.deep.equal([])
    })

    it("should handle a single parameter that is a function", () => {
        const { query, parameters } = sql`
            SELECT * FROM example WHERE id = ${() => "test"}
        `

        expect(query).to.equal("SELECT * FROM example WHERE id = $1")
        expect(parameters).to.deep.equal(["test"])
    })

    it("should handle parameters at the start, middle, and end", () => {
        const { query, parameters } = sql`
            SELECT * FROM example WHERE id = ${"testId"} AND name = ${"testName"} ORDER BY ${"id"}
        `

        expect(query).to.equal(
            "SELECT * FROM example WHERE id = $1 AND name = $2 ORDER BY $3",
        )
        expect(parameters).to.deep.equal(["testId", "testName", "id"])
    })

    it("should handle adjacent parameters", () => {
        const { query, parameters } = sql`
            INSERT INTO example (id, name) VALUES (${"adjacent1"},${"adjacentName"})
        `
        expect(query).to.equal("INSERT INTO example (id, name) VALUES ($1,$2)")
        expect(parameters).to.deep.equal(["adjacent1", "adjacentName"])
    })

    it("should handle multiple spread arrays correctly", () => {
        const ids1 = ["id1", "id2"]
        const ids2 = ["id3", "id4"]
        const nameVal = "multiSpread"

        const { query, parameters } = sql`
            SELECT * FROM example
            WHERE (id = ANY(${() => ids1}) OR id = ANY(${() => ids2}))
            AND name = ${nameVal}
        `

        expect(query).to.equal(
            [
                "SELECT * FROM example",
                "WHERE (id = ANY($1, $2) OR id = ANY($3, $4))",
                "AND name = $5",
            ].join("\n"),
        )

        expect(parameters).to.deep.equal([
            "id1",
            "id2",
            "id3",
            "id4",
            "multiSpread",
        ])
    })
})
