import { expect } from "chai"
import sinon from "sinon"
import { fail } from "../../src/cli/error"

describe("fail", () => {
    let stderrStub: sinon.SinonStub
    let exitStub: sinon.SinonStub

    beforeEach(() => {
        stderrStub = sinon.stub(console, "error")
        exitStub = sinon.stub(process, "exit")
    })

    afterEach(() => {
        stderrStub.restore()
        exitStub.restore()
    })

    it("should print error message in red", () => {
        fail("something went wrong")

        expect(stderrStub.calledOnce).to.be.true
        const output = stderrStub.firstCall.args[0]
        expect(output).to.include("something went wrong")
        expect(output).to.include("\x1b[31m")
    })

    it("should call process.exit(1)", () => {
        fail("error")

        expect(exitStub.calledOnce).to.be.true
        expect(exitStub.calledWith(1)).to.be.true
    })

    it("should call beforeExit callback before exiting", () => {
        const beforeExit = sinon.spy()

        fail("error", beforeExit)

        expect(beforeExit.calledOnce).to.be.true
        expect(beforeExit.calledBefore(exitStub)).to.be.true
    })

    it("should not call beforeExit if not provided", () => {
        fail("error")

        expect(exitStub.calledOnce).to.be.true
    })
})
