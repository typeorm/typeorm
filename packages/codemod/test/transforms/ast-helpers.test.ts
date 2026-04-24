import { expect } from "chai"
import jscodeshift, { type ASTNode } from "jscodeshift"
import {
    fileImportsFrom,
    getLocalNamesForImport,
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

    describe("fileImportsFrom", () => {
        it("matches ESM import from the exact module", () => {
            const root = j('import { DataSource } from "typeorm"')
            expect(fileImportsFrom(root, j, "typeorm")).to.be.true
        })

        it("matches ESM import from a sub-path", () => {
            const root = j(
                'import type { SapConnectionOptions } from "typeorm/driver/sap/SapConnectionOptions"',
            )
            expect(fileImportsFrom(root, j, "typeorm")).to.be.true
        })

        it("matches ESM side-effect import", () => {
            const root = j('import "typeorm"')
            expect(fileImportsFrom(root, j, "typeorm")).to.be.true
        })

        it("matches CommonJS `require(...)`", () => {
            const root = j('const { DataSource } = require("typeorm")')
            expect(fileImportsFrom(root, j, "typeorm")).to.be.true
        })

        it("matches CommonJS `require(...)` from a sub-path", () => {
            const root = j(
                'const { SapConnectionOptions } = require("typeorm/driver/sap/SapConnectionOptions")',
            )
            expect(fileImportsFrom(root, j, "typeorm")).to.be.true
        })

        it("matches TypeScript `import ... = require(...)`", () => {
            const root = j('import typeorm = require("typeorm")')
            expect(fileImportsFrom(root, j, "typeorm")).to.be.true
        })

        it("does not match a module whose name shares a prefix", () => {
            const root = j('import { foo } from "typeorm-extension"')
            expect(fileImportsFrom(root, j, "typeorm")).to.be.false
        })

        it("does not match files with no import", () => {
            const root = j('const x = "typeorm"')
            expect(fileImportsFrom(root, j, "typeorm")).to.be.false
        })

        it("does not match require calls for other modules", () => {
            const root = j('const fs = require("node:fs")')
            expect(fileImportsFrom(root, j, "typeorm")).to.be.false
        })

        it("matches ESM named re-export from the exact module", () => {
            const root = j('export { DataSource } from "typeorm"')
            expect(fileImportsFrom(root, j, "typeorm")).to.be.true
        })

        it("matches ESM named re-export from a sub-path", () => {
            const root = j(
                'export { SapDataSourceOptions } from "typeorm/driver/sap/SapDataSourceOptions"',
            )
            expect(fileImportsFrom(root, j, "typeorm")).to.be.true
        })

        it("matches ESM `export *` from the exact module", () => {
            const root = j('export * from "typeorm"')
            expect(fileImportsFrom(root, j, "typeorm")).to.be.true
        })

        it("matches ESM `export *` from a sub-path", () => {
            const root = j(
                'export * from "typeorm/driver/sap/SapDataSourceOptions"',
            )
            expect(fileImportsFrom(root, j, "typeorm")).to.be.true
        })

        it("does not match re-exports from a prefix-sharing module", () => {
            const root = j('export * from "typeorm-extension"')
            expect(fileImportsFrom(root, j, "typeorm")).to.be.false
        })

        it("does not match a local re-export without a source", () => {
            const root = j("const foo = 1; export { foo }")
            expect(fileImportsFrom(root, j, "typeorm")).to.be.false
        })
    })

    describe("getLocalNamesForImport", () => {
        const localNames = (src: string) =>
            [
                ...getLocalNamesForImport(j(src), j, "typeorm", "getManager"),
            ].sort()

        it("finds ESM direct-import binding", () => {
            expect(
                localNames('import { getManager } from "typeorm"'),
            ).to.deep.equal(["getManager"])
        })

        it("finds ESM aliased-import binding", () => {
            expect(
                localNames('import { getManager as gm } from "typeorm"'),
            ).to.deep.equal(["gm"])
        })

        it("finds CommonJS destructured binding", () => {
            expect(
                localNames('const { getManager } = require("typeorm")'),
            ).to.deep.equal(["getManager"])
        })

        it("finds CommonJS aliased-destructured binding", () => {
            expect(
                localNames('const { getManager: gm } = require("typeorm")'),
            ).to.deep.equal(["gm"])
        })

        it("returns empty set for a name that is not imported", () => {
            expect(localNames('import { other } from "typeorm"')).to.deep.equal(
                [],
            )
        })

        it("returns empty set for imports from a different module", () => {
            expect(
                localNames('import { getManager } from "other-lib"'),
            ).to.deep.equal([])
        })
    })
})
