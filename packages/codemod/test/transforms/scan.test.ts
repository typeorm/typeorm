import { expect } from "chai"
import {
    getTransformNames,
    getTransformPath,
    getTransformDir,
    getCompositeTransformPath,
} from "../../src/transforms/scan"

describe("scan", () => {
    describe("getTransformDir", () => {
        it("should return path for a version", () => {
            expect(getTransformDir("v1")).to.include("transforms/v1")
        })
    })

    describe("getTransformNames", () => {
        it("should return sorted list of transform names for v1", () => {
            const names = getTransformNames("v1")
            expect(names).to.be.an("array")
            expect(names.length).to.be.greaterThan(0)
            expect(names).to.include("rename-find-by-ids")
            expect(names).to.include("replace-sqlite-type")
            expect(names).to.not.include("index")
        })

        it("should return names sorted alphabetically", () => {
            const names = getTransformNames("v1")
            const sorted = [...names].sort()
            expect(names).to.deep.equal(sorted)
        })
    })

    describe("getTransformPath", () => {
        it("should return path for existing transform", () => {
            const result = getTransformPath("v1", "rename-find-by-ids")
            expect(result).to.not.be.null
            expect(result).to.include("rename-find-by-ids")
        })

        it("should return null for non-existing transform", () => {
            const result = getTransformPath("v1", "does-not-exist")
            expect(result).to.be.null
        })
    })

    describe("getCompositeTransformPath", () => {
        it("should return path to index file", () => {
            const result = getCompositeTransformPath("v1")
            expect(result).to.include("v1/index")
        })
    })
})
