import { expect } from "chai"
import { stats } from "../../src/transforms/stats"

describe("stats.collect.todos", () => {
    it("should group TODO stats by transform name", () => {
        const raw = {
            "todo:use-container:src/app.ts": 1,
            "todo:use-container:src/config.ts": 1,
            "todo:global-functions:src/repos.ts": 1,
        }

        const result = stats.collect.todos(raw)

        expect(result.size).to.equal(2)
        expect(result.get("use-container")).to.deep.equal([
            "src/app.ts",
            "src/config.ts",
        ])
        expect(result.get("global-functions")).to.deep.equal(["src/repos.ts"])
    })

    it("should return empty map for empty stats", () => {
        const result = stats.collect.todos({})
        expect(result.size).to.equal(0)
    })

    it("should ignore non-todo stats", () => {
        const raw = {
            "some-other-stat": 5,
            "todo:my-transform:file.ts": 1,
        }

        const result = stats.collect.todos(raw)
        expect(result.size).to.equal(1)
        expect(result.get("my-transform")).to.deep.equal(["file.ts"])
    })
})

describe("stats.collect.applied", () => {
    it("should collect applied transform counts", () => {
        const raw = {
            "applied:connection-to-datasource": 5,
            "applied:find-options-string-relations": 12,
        }

        const result = stats.collect.applied(raw)

        expect(result.size).to.equal(2)
        expect(result.get("connection-to-datasource")).to.equal(5)
        expect(result.get("find-options-string-relations")).to.equal(12)
    })

    it("should return empty map for empty stats", () => {
        const result = stats.collect.applied({})
        expect(result.size).to.equal(0)
    })

    it("should ignore non-applied stats", () => {
        const raw = {
            "todo:some-transform:file.ts": 1,
            "applied:datasource-name": 3,
        }

        const result = stats.collect.applied(raw)
        expect(result.size).to.equal(1)
        expect(result.get("datasource-name")).to.equal(3)
    })
})
