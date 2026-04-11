import { expect } from "chai"
import jscodeshift, { type ASTNode } from "jscodeshift"
import {
    getStringValue,
    setStringValue,
} from "../../src/transforms/ast-helpers"

const j = jscodeshift.withParser("tsx")

describe("ast-helpers", () => {
    describe("getStringValue", () => {
        it("should extract value from StringLiteral", () => {
            const root = j('const x = "hello"')
            const literal: ASTNode = root.find(j.StringLiteral).get().node
            expect(getStringValue(literal)).to.equal("hello")
        })

        it("should return null for non-string nodes", () => {
            const root = j("const x = 42")
            const literal: ASTNode = root.find(j.NumericLiteral).get().node
            expect(getStringValue(literal)).to.be.null
        })

        it("should return null for identifiers", () => {
            const root = j("const x = foo")
            const id: ASTNode = root
                .find(j.Identifier, { name: "foo" })
                .get().node
            expect(getStringValue(id)).to.be.null
        })
    })

    describe("setStringValue", () => {
        it("should set value on StringLiteral", () => {
            const root = j('const x = "old"')
            const literal: ASTNode = root.find(j.StringLiteral).get().node
            setStringValue(literal, "new")
            expect(root.toSource()).to.include('"new"')
        })

        it("should not throw on non-string nodes", () => {
            const root = j("const x = 42")
            const literal: ASTNode = root.find(j.NumericLiteral).get().node
            expect(() => setStringValue(literal, "test")).to.not.throw()
        })
    })
})
