import { expect } from "chai"
import { collectTodos } from "../../src/transforms/todo"

describe("collectTodos", () => {
    it("should group TODO stats by transform name", () => {
        const stats = {
            "todo:remove-use-container:src/app.ts": 1,
            "todo:remove-use-container:src/config.ts": 1,
            "todo:replace-global-functions:src/repos.ts": 1,
        }

        const result = collectTodos(stats)

        expect(result.size).to.equal(2)
        expect(result.get("remove-use-container")).to.deep.equal([
            "src/app.ts",
            "src/config.ts",
        ])
        expect(result.get("replace-global-functions")).to.deep.equal([
            "src/repos.ts",
        ])
    })

    it("should return empty map for empty stats", () => {
        const result = collectTodos({})
        expect(result.size).to.equal(0)
    })

    it("should ignore non-todo stats", () => {
        const stats = {
            "some-other-stat": 5,
            "todo:my-transform:file.ts": 1,
        }

        const result = collectTodos(stats)
        expect(result.size).to.equal(1)
        expect(result.get("my-transform")).to.deep.equal(["file.ts"])
    })
})
