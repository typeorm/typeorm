import { expect } from "chai"
import jscodeshift, {
    type API,
    type FileInfo,
    type Transform,
} from "jscodeshift"
import {
    type TransformModule,
    transformer,
} from "../../src/transforms/transformer"

describe("transformer", () => {
    const mockApi = {
        jscodeshift: jscodeshift.withParser("tsx"),
        stats: () => {},
        report: () => {},
    } as unknown as API

    const makeFile = (source: string): FileInfo => ({
        path: "test.ts",
        source,
    })

    const mod = (name: string, fn: Transform): TransformModule => ({
        name,
        fn,
    })

    it("should run transforms in sequence", () => {
        const composite = transformer([
            mod("t1", (file: FileInfo) => file.source.replace("foo", "bar")),
            mod("t2", (file: FileInfo) => file.source.replace("bar", "baz")),
        ])
        const result = composite(makeFile("foo"), mockApi, {})

        expect(result).to.equal("baz")
    })

    it("should return undefined when no transforms change anything", () => {
        const composite = transformer([mod("noop", () => undefined)])
        const result = composite(makeFile("const x = 1"), mockApi, {})

        expect(result).to.be.undefined
    })

    it("should skip transforms that return undefined", () => {
        const composite = transformer([
            mod("noop", () => undefined),
            mod("real", (file: FileInfo) => file.source.replace("old", "new")),
        ])
        const result = composite(makeFile("old"), mockApi, {})

        expect(result).to.equal("new")
    })

    it("should pass updated source to subsequent transforms", () => {
        const sources: string[] = []
        const tracking = (file: FileInfo) => {
            sources.push(file.source)
            return file.source + "!"
        }

        const composite = transformer([
            mod("t1", tracking),
            mod("t2", tracking),
        ])
        void composite(makeFile("start"), mockApi, {})

        expect(sources).to.deep.equal(["start", "start!"])
    })
})
