import { expect } from "chai"
import sinon from "sinon"
import { resolveTransforms } from "../../src/transforms/resolve"

describe("resolveTransforms", () => {
    let exitStub: sinon.SinonStub
    let stderrStub: sinon.SinonStub

    beforeEach(() => {
        exitStub = sinon.stub(process, "exit")
        stderrStub = sinon.stub(console, "error")
    })

    afterEach(() => {
        exitStub.restore()
        stderrStub.restore()
    })

    it("should return composite index path when no transform specified", () => {
        const result = resolveTransforms("v1")
        expect(result).to.have.lengthOf(1)
        expect(result[0]).to.include("v1/index")
    })

    it("should return specific transform path when transform is specified", () => {
        const result = resolveTransforms("v1", "rename-find-by-ids")
        expect(result).to.have.lengthOf(1)
        expect(result[0]).to.include("rename-find-by-ids")
    })

    it("should call process.exit for unknown version", () => {
        resolveTransforms("v99")
        expect(exitStub.calledWith(1)).to.be.true
    })

    it("should call process.exit for unknown transform", () => {
        resolveTransforms("v1", "does-not-exist")
        expect(exitStub.calledWith(1)).to.be.true
    })
})
