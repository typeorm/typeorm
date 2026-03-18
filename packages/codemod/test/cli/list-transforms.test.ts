import { expect } from "chai"
import sinon from "sinon"
import { listTransforms } from "../../src/cli/list-transforms"

describe("listTransforms", () => {
    let logStub: sinon.SinonStub

    beforeEach(() => {
        logStub = sinon.stub(console, "log")
    })

    afterEach(() => {
        logStub.restore()
    })

    it("should print transform names for v1", () => {
        listTransforms("v1")

        const output = logStub.args.map((a) => a[0]).join("\n")
        expect(output).to.include("rename-find-by-ids")
        expect(output).to.include("replace-sqlite-type")
    })

    it("should mark manual transforms with (*)", () => {
        listTransforms("v1")

        const output = logStub.args.map((a) => a[0]).join("\n")
        expect(output).to.include("remove-use-container")
        expect(output).to.include("(*)")
    })

    it("should show warning about manual transforms", () => {
        listTransforms("v1")

        const output = logStub.args.map((a) => a[0]).join("\n")
        expect(output).to.include("Warning:")
        expect(output).to.include("manual review")
    })

    it("should throw for unknown version", () => {
        expect(() => listTransforms("v99")).to.throw("No transforms found")
    })
})
