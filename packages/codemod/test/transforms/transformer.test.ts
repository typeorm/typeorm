import { expect } from "chai"
import type { API, FileInfo } from "jscodeshift"
import { transformer } from "../../src/transforms/transformer"

describe("transformer", () => {
    const mockApi = {
        jscodeshift: require("jscodeshift").withParser("tsx"),
        stats: () => {},
        report: () => {},
    } as unknown as API

    const makeFile = (source: string): FileInfo => ({
        path: "test.ts",
        source,
    })

    it("should run transforms in sequence", () => {
        const transform1 = (file: FileInfo) => file.source.replace("foo", "bar")
        const transform2 = (file: FileInfo) => file.source.replace("bar", "baz")

        const composite = transformer([transform1, transform2])
        const result = composite(makeFile("foo"), mockApi, {})

        expect(result).to.equal("baz")
    })

    it("should return undefined when no transforms change anything", () => {
        const noopTransform = () => undefined

        const composite = transformer([noopTransform])
        const result = composite(makeFile("const x = 1"), mockApi, {})

        expect(result).to.be.undefined
    })

    it("should skip transforms that return undefined", () => {
        const noopTransform = () => undefined
        const realTransform = (file: FileInfo) =>
            file.source.replace("old", "new")

        const composite = transformer([noopTransform, realTransform])
        const result = composite(makeFile("old"), mockApi, {})

        expect(result).to.equal("new")
    })

    it("should pass updated source to subsequent transforms", () => {
        const sources: string[] = []
        const tracking = (file: FileInfo) => {
            sources.push(file.source)
            return file.source + "!"
        }

        const composite = transformer([tracking, tracking])
        void composite(makeFile("start"), mockApi, {})

        expect(sources).to.deep.equal(["start", "start!"])
    })
})
