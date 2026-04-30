import { expect } from "chai"
import jscodeshift, { type ASTNode, type ObjectExpression } from "jscodeshift"
import {
    fileImportsFrom,
    forEachColumnMetadataOptionsArg,
    getLocalNamesForImport,
    getNamespaceLocalNames,
    getObjectPropertyKeyName,
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

        it("ignores inside-function CommonJS requires", () => {
            // Keeping the collector aligned with the shadow guard used by
            // `forEachColumnMetadataOptionsArg`: bindings declared below the
            // module scope would be rejected at the call site anyway, so
            // excluding them here avoids recording names that never match.
            expect(
                localNames(
                    'function f() { const { getManager } = require("typeorm"); return getManager() }',
                ),
            ).to.deep.equal([])
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

        it("includes type-only import by default (no valueOnly)", () => {
            expect(
                localNames('import type { getManager } from "typeorm"'),
            ).to.deep.equal(["getManager"])
        })

        it("skips declaration-level type-only import when valueOnly is set", () => {
            const names = [
                ...getLocalNamesForImport(
                    j('import type { getManager } from "typeorm"'),
                    j,
                    "typeorm",
                    "getManager",
                    { valueOnly: true },
                ),
            ]
            expect(names).to.deep.equal([])
        })

        it("skips per-specifier type-only when valueOnly is set", () => {
            const names = [
                ...getLocalNamesForImport(
                    j(
                        'import { type getManager, getRepository } from "typeorm"',
                    ),
                    j,
                    "typeorm",
                    "getManager",
                    { valueOnly: true },
                ),
            ]
            expect(names).to.deep.equal([])
        })

        it("includes value imports even when valueOnly is set", () => {
            const names = [
                ...getLocalNamesForImport(
                    j('import { getManager } from "typeorm"'),
                    j,
                    "typeorm",
                    "getManager",
                    { valueOnly: true },
                ),
            ]
            expect(names).to.deep.equal(["getManager"])
        })
    })

    describe("getNamespaceLocalNames", () => {
        const namespaceNames = (src: string, valueOnly = false) =>
            [
                ...getNamespaceLocalNames(j(src), j, "typeorm", {
                    valueOnly,
                }),
            ].sort()

        it("finds ESM namespace import", () => {
            expect(
                namespaceNames('import * as typeorm from "typeorm"'),
            ).to.deep.equal(["typeorm"])
        })

        it("finds TS import-equals binding", () => {
            expect(
                namespaceNames('import typeorm = require("typeorm")'),
            ).to.deep.equal(["typeorm"])
        })

        it("finds CommonJS require-assigned binding", () => {
            expect(
                namespaceNames('const typeorm = require("typeorm")'),
            ).to.deep.equal(["typeorm"])
        })

        it("ignores inside-function CommonJS requires", () => {
            // Aligned with `getLocalNamesForImport`: inner-scope bindings
            // never match the call-site scope guard, so recording them here
            // would be a dead entry in the namespace set.
            expect(
                namespaceNames(
                    'function f() { const typeorm = require("typeorm"); return typeorm }',
                ),
            ).to.deep.equal([])
        })

        it("includes type-only namespace import by default", () => {
            expect(
                namespaceNames('import type * as typeorm from "typeorm"'),
            ).to.deep.equal(["typeorm"])
        })

        it("skips type-only namespace import when valueOnly is set", () => {
            expect(
                namespaceNames('import type * as typeorm from "typeorm"', true),
            ).to.deep.equal([])
        })

        it("includes non-type namespace import when valueOnly is set", () => {
            expect(
                namespaceNames('import * as typeorm from "typeorm"', true),
            ).to.deep.equal(["typeorm"])
        })
    })

    describe("getObjectPropertyKeyName", () => {
        type AnyProp = Parameters<typeof getObjectPropertyKeyName>[0]

        const firstProp = (src: string): AnyProp => {
            const obj: ObjectExpression = j(`const x = ${src}`)
                .find(j.ObjectExpression)
                .get().node
            return obj.properties[0]
        }

        const keyOf = (src: string): string | null =>
            getObjectPropertyKeyName(firstProp(src))

        it("reads plain identifier keys", () => {
            expect(keyOf("{ foo: 1 }")).to.equal("foo")
        })

        it("reads string-literal keys", () => {
            expect(keyOf("{ 'foo': 1 }")).to.equal("foo")
            expect(keyOf('{ "foo": 1 }')).to.equal("foo")
        })

        it("reads constant computed string-literal keys", () => {
            // `['foo']: …` has the same runtime key as `foo: …`; we want
            // transforms to match these so the migration applies to every
            // equivalent form users may have written.
            expect(keyOf("{ ['foo']: 1 }")).to.equal("foo")
            expect(keyOf('{ ["foo"]: 1 }')).to.equal("foo")
        })

        it("returns null for dynamic computed keys", () => {
            // `[name]` / `[getKey()]` resolve at runtime; the transform
            // cannot know the name statically, so the property must not
            // match any literal target.
            expect(keyOf("{ [name]: 1 }")).to.be.null
            expect(keyOf("{ [getKey()]: 1 }")).to.be.null
        })

        it("returns null for numeric keys", () => {
            expect(keyOf("{ 0: 1 }")).to.be.null
            expect(keyOf("{ 42: 'x' }")).to.be.null
        })

        it("returns null for spread elements", () => {
            expect(keyOf("{ ...y }")).to.be.null
        })
    })

    describe("forEachColumnMetadataOptionsArg", () => {
        const target = { moduleName: "typeorm", className: "ColumnMetadata" }

        const countInvocations = (src: string): number => {
            let count = 0
            forEachColumnMetadataOptionsArg(j(src), j, target, () => {
                count += 1
            })
            return count
        }

        const capturedKeys = (src: string): string[][] => {
            const results: string[][] = []
            forEachColumnMetadataOptionsArg(
                j(src),
                j,
                target,
                (options: ObjectExpression) => {
                    results.push(
                        options.properties.flatMap((p) => {
                            if (
                                (p.type === "Property" ||
                                    p.type === "ObjectProperty") &&
                                p.key.type === "Identifier"
                            ) {
                                return [p.key.name]
                            }
                            return []
                        }),
                    )
                },
            )
            return results
        }

        it("fires on direct-import constructor with args.options", () => {
            const src = [
                'import { ColumnMetadata } from "typeorm"',
                "new ColumnMetadata({ args: { options: { readonly: true } } })",
            ].join("\n")
            expect(countInvocations(src)).to.equal(1)
            expect(capturedKeys(src)).to.deep.equal([["readonly"]])
        })

        it("fires on namespace-qualified constructor", () => {
            const src = [
                'import * as typeorm from "typeorm"',
                "new typeorm.ColumnMetadata({ args: { options: { readonly: true } } })",
            ].join("\n")
            expect(countInvocations(src)).to.equal(1)
        })

        it("does not fire on type-only named import", () => {
            // Reuse the imported name at the value level — `valueOnly: true`
            // must filter the type-only `ColumnMetadata` out of the match
            // set, so the runtime `new ColumnMetadata(...)` below refers to
            // the local class and the rewrite must not fire. Testing with a
            // differently-named runtime (e.g. `const CM = class`) wouldn't
            // exercise the filter because `CM` is not in classLocalNames to
            // begin with.
            const src = [
                'import type { ColumnMetadata } from "typeorm"',
                "const ColumnMetadata = class { constructor(_o: any) {} }",
                "new ColumnMetadata({ args: { options: { readonly: true } } })",
            ].join("\n")
            expect(countInvocations(src)).to.equal(0)
        })

        it("does not fire on a shadowed identifier in an inner scope", () => {
            const src = [
                'import { ColumnMetadata } from "typeorm"',
                "function build(ColumnMetadata: any) {",
                "    return new ColumnMetadata({ args: { options: { readonly: true } } })",
                "}",
            ].join("\n")
            expect(countInvocations(src)).to.equal(0)
        })

        it("does not fire when no args.options key is present", () => {
            const src = [
                'import { ColumnMetadata } from "typeorm"',
                "new ColumnMetadata({ args: {} })",
            ].join("\n")
            expect(countInvocations(src)).to.equal(0)
        })

        it("does not fire when the first arg is not an object", () => {
            const src = [
                'import { ColumnMetadata } from "typeorm"',
                "new ColumnMetadata('positional')",
            ].join("\n")
            expect(countInvocations(src)).to.equal(0)
        })

        it("uses last occurrence for duplicate options keys", () => {
            const src = [
                'import { ColumnMetadata } from "typeorm"',
                "new ColumnMetadata({",
                "    args: {",
                "        options: { readonly: true },",
                "        options: { update: false },",
                "    },",
                "})",
            ].join("\n")
            expect(capturedKeys(src)).to.deep.equal([["update"]])
        })
    })
})
