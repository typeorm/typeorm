import type {
    ASTNode,
    ASTPath,
    ClassProperty,
    Collection,
    Decorator,
    Identifier,
    JSCodeshift,
    ObjectExpression,
} from "jscodeshift"

/**
 * Extracts a string value from a StringLiteral or Literal node.
 * Returns null if the node is not a string literal.
 */
export const getStringValue = (node: ASTNode): string | null => {
    if (node.type === "StringLiteral") {
        return node.value
    }

    if (node.type === "Literal") {
        return typeof node.value === "string" ? node.value : null
    }

    return null
}

/**
 * Sets the string value on a StringLiteral or Literal node.
 */
export const setStringValue = (node: ASTNode, value: string): void => {
    if (node.type === "StringLiteral" || node.type === "Literal") {
        node.value = value
    }
}

/**
 * Type guard that narrows an AST node to an Identifier.
 */
export const isIdentifier = (node: { type: string }): node is Identifier =>
    node.type === "Identifier"

/**
 * Checks whether the file contains an import from the given module. Matches
 * both the exact module name (`"typeorm"`) and any sub-path (`"typeorm/..."`),
 * and recognizes ESM `import`, TypeScript `import = require(...)`, and
 * CommonJS `require(...)` forms so that `.js`/`.jsx` callers still pass the
 * scope guard.
 */
export const fileImportsFrom = (
    root: Collection,
    j: JSCodeshift,
    moduleName: string,
): boolean => {
    const prefix = `${moduleName}/`
    const matchesModule = (source: unknown): boolean =>
        typeof source === "string" &&
        (source === moduleName || source.startsWith(prefix))

    // ESM: import ... from "typeorm[/subpath]"
    if (
        root
            .find(j.ImportDeclaration)
            .some((path) => matchesModule(path.node.source.value))
    ) {
        return true
    }

    // TS: import ... = require("typeorm[/subpath]")
    if (
        root.find(j.TSImportEqualsDeclaration).some((path) => {
            const ref = path.node.moduleReference
            return (
                ref.type === "TSExternalModuleReference" &&
                matchesModule(getStringValue(ref.expression))
            )
        })
    ) {
        return true
    }

    // CommonJS: require("typeorm[/subpath]")
    return root
        .find(j.CallExpression, {
            callee: { type: "Identifier", name: "require" },
        })
        .some((path) => {
            const [arg] = path.node.arguments
            return arg !== undefined && matchesModule(getStringValue(arg))
        })
}

/**
 * Returns the set of local identifiers bound to a given named export.
 * Handles ESM direct/aliased imports and CommonJS destructured requires:
 *
 *   import { RelationCount } from "typeorm"         → { "RelationCount" }
 *   import { RelationCount as RC } from "typeorm"   → { "RC" }
 *   const { RelationCount } = require("typeorm")    → { "RelationCount" }
 *   const { RelationCount: RC } = require("typeorm")→ { "RC" }
 */
export const getLocalNamesForImport = (
    root: Collection,
    j: JSCodeshift,
    moduleName: string,
    importedName: string,
): Set<string> => {
    const localNames = new Set<string>()

    // ESM: `import { X [as Y] } from "moduleName"`
    root.find(j.ImportDeclaration, {
        source: { value: moduleName },
    }).forEach((importPath) => {
        for (const spec of importPath.node.specifiers ?? []) {
            if (
                spec.type !== "ImportSpecifier" ||
                spec.imported.type !== "Identifier" ||
                spec.imported.name !== importedName
            ) {
                continue
            }
            const local = spec.local ?? spec.imported
            if (local.type === "Identifier") {
                localNames.add(local.name)
            }
        }
    })

    // CommonJS: `const { X [: Y] } = require("moduleName")`
    root.find(j.CallExpression, {
        callee: { type: "Identifier", name: "require" },
    }).forEach((callPath) => {
        const [arg] = callPath.node.arguments
        if (!arg || getStringValue(arg) !== moduleName) return

        const parent = callPath.parent.node
        if (parent.type !== "VariableDeclarator") return
        const id = parent.id
        if (id.type !== "ObjectPattern") return

        for (const prop of id.properties) {
            if (prop.type !== "Property" && prop.type !== "ObjectProperty") {
                continue
            }
            if (
                prop.key.type !== "Identifier" ||
                prop.key.name !== importedName
            ) {
                continue
            }
            // Extract the binding name from each destructuring variant:
            //   { X }              → "X"            (Identifier)
            //   { X: Y }           → "Y"            (Identifier alias)
            //   { X = fallback }   → "X"            (AssignmentPattern, shorthand)
            //   { X: Y = fallback }→ "Y"            (AssignmentPattern, aliased)
            let localName: string = prop.key.name
            if (prop.value.type === "Identifier") {
                localName = prop.value.name
            } else if (
                prop.value.type === "AssignmentPattern" &&
                prop.value.left.type === "Identifier"
            ) {
                localName = prop.value.left.name
            }
            localNames.add(localName)
        }
    })

    return localNames
}

/**
 * Collects local namespace bindings for a module. Covers:
 *
 *   import * as typeorm from "typeorm"           → "typeorm"
 *   const typeorm = require("typeorm")           → "typeorm"
 *   import typeorm = require("typeorm")          → "typeorm"
 *
 * Useful when a transform needs to recognise `typeorm.Foo` member-expression
 * references alongside named `Foo` imports handled by `getLocalNamesForImport`.
 */
export const getNamespaceLocalNames = (
    root: Collection,
    j: JSCodeshift,
    moduleName: string,
): Set<string> => {
    const localNames = new Set<string>()

    // ESM: `import * as ns from "moduleName"`
    root.find(j.ImportDeclaration, {
        source: { value: moduleName },
    }).forEach((importPath) => {
        for (const spec of importPath.node.specifiers ?? []) {
            if (
                spec.type === "ImportNamespaceSpecifier" &&
                spec.local?.type === "Identifier"
            ) {
                localNames.add(spec.local.name)
            }
        }
    })

    // TypeScript: `import ns = require("moduleName")`
    root.find(j.TSImportEqualsDeclaration).forEach((importPath) => {
        const ref = importPath.node.moduleReference
        if (ref.type !== "TSExternalModuleReference") return
        if (getStringValue(ref.expression) !== moduleName) return
        if (importPath.node.id?.type === "Identifier") {
            localNames.add(importPath.node.id.name)
        }
    })

    // CommonJS: `const ns = require("moduleName")`
    root.find(j.CallExpression, {
        callee: { type: "Identifier", name: "require" },
    }).forEach((callPath) => {
        const [arg] = callPath.node.arguments
        if (!arg || getStringValue(arg) !== moduleName) return

        const parent = callPath.parent.node
        if (
            parent.type !== "VariableDeclarator" ||
            parent.id.type !== "Identifier"
        ) {
            return
        }
        const name: string = parent.id.name
        localNames.add(name)
    })

    return localNames
}

/**
 * Calls `callback` for each Identifier parameter found in function-like
 * nodes (functions, methods, arrows) and TSParameterProperty nodes.
 */
export const forEachIdentifierParam = (
    root: Collection,
    j: JSCodeshift,
    callback: (id: Identifier) => void,
): void => {
    const collectParams = (params: { type: string }[]) => {
        params.filter(isIdentifier).forEach(callback)
    }
    root.find(j.FunctionDeclaration).forEach((p) =>
        collectParams(p.node.params),
    )
    root.find(j.FunctionExpression).forEach((p) => collectParams(p.node.params))
    root.find(j.ArrowFunctionExpression).forEach((p) =>
        collectParams(p.node.params),
    )
    root.find(j.ClassMethod).forEach((p) => collectParams(p.node.params))
    root.find(j.TSDeclareMethod).forEach((p) => collectParams(p.node.params))
    root.find(j.TSParameterProperty).forEach((path) => {
        if (isIdentifier(path.node.parameter)) callback(path.node.parameter)
    })
}

/**
 * TypeORM column-family decorator names. Exposed so decorator-scoped
 * transforms can narrow their match set and skip unrelated decorators like
 * Angular's `@Input` or class-validator's `@IsDefined` without relying on a
 * file-level `fileImportsFrom` guard.
 */
export const TYPEORM_COLUMN_DECORATORS: ReadonlySet<string> = new Set([
    "Column",
    "PrimaryColumn",
    "PrimaryGeneratedColumn",
    "VersionColumn",
    "CreateDateColumn",
    "UpdateDateColumn",
    "DeleteDateColumn",
    "ObjectIdColumn",
    "ViewColumn",
])

/**
 * Expands a set of exported names into the local bindings each one has in
 * the file — covers ESM aliases (`import { Column as C }`) and CJS aliases
 * (`const { Column: C } = require(...)`). Returns a union set suitable for
 * alias-aware identifier matching.
 */
export const expandLocalNamesForImports = (
    root: Collection,
    j: JSCodeshift,
    moduleName: string,
    importedNames: ReadonlySet<string>,
): Set<string> => {
    const expanded = new Set<string>()
    for (const name of importedNames) {
        for (const local of getLocalNamesForImport(root, j, moduleName, name)) {
            expanded.add(local)
        }
    }
    return expanded
}

/**
 * Traverses ClassProperty decorators and calls `callback` for each
 * ObjectExpression argument found in decorator call expressions.
 *
 * Pass `decoratorNames` to restrict the traversal to a known set of callees
 * (e.g. TypeORM's column decorators). Without it, every decorator-with-object
 * on every class property is visited.
 */
export const forEachDecoratorObjectArg = (
    root: Collection,
    j: JSCodeshift,
    callback: (objectExpression: ObjectExpression, path: ASTPath) => void,
    decoratorNames?: ReadonlySet<string>,
): void => {
    // ast-types omits `decorators` from ClassProperty — widen the type so
    // downstream traversal can inspect the decorators array safely.
    interface ClassPropertyWithDecorators extends ClassProperty {
        decorators?: Decorator[]
    }
    root.find(j.ClassProperty).forEach((path) => {
        const node: ClassPropertyWithDecorators = path.node
        if (!node.decorators) return

        for (const decorator of node.decorators) {
            if (decorator.expression.type !== "CallExpression") continue

            if (decoratorNames) {
                const callee = decorator.expression.callee
                if (
                    callee.type !== "Identifier" ||
                    !decoratorNames.has(callee.name)
                ) {
                    continue
                }
            }

            for (const arg of decorator.expression.arguments) {
                if (arg.type !== "ObjectExpression") continue
                callback(arg, path)
            }
        }
    })
}

/**
 * Returns the key name for an `ObjectProperty` / `Property` node. Handles
 * both identifier keys (`name`) and string-literal keys (`"name"`); returns
 * null for computed, numeric, or otherwise non-string keys, and for node
 * types that don't carry a key at all (spread elements, etc.).
 */
export const getObjectPropertyKeyName = (
    prop: ObjectExpression["properties"][number],
): string | null => {
    if (prop.type !== "Property" && prop.type !== "ObjectProperty") return null
    if (prop.key.type === "Identifier") return prop.key.name
    return getStringValue(prop.key)
}

/**
 * Peels TypeScript expression wrappers around a value so callers see the
 * underlying node. Handles `as X` / `x!` / `x satisfies X` / `<X>x`. Used
 * by transforms that inspect values which users may annotate with type
 * assertions — e.g. `type: "expo" as const`, `{ logPath: "x" } as Options`.
 *
 * Generic over the node type so callers can keep their original narrowing
 * — in practice the returned node is the same type as the input (with TS
 * wrapper variants peeled off).
 */
export const unwrapTsExpression = <T extends { type: string }>(node: T): T => {
    let current = node
    while (
        current.type === "TSAsExpression" ||
        current.type === "TSNonNullExpression" ||
        current.type === "TSSatisfiesExpression" ||
        current.type === "TSTypeAssertion"
    ) {
        const inner = (current as unknown as { expression?: T }).expression
        if (!inner) break
        current = inner
    }
    return current
}

/**
 * Removes properties matching the given key names from an ObjectExpression.
 * Matches both identifier keys (`name`) and string-literal keys (`"name"`).
 * Returns true if any properties were removed.
 */
export const removeObjectProperties = (
    obj: ObjectExpression,
    propertyNames: Set<string>,
): boolean =>
    removeObjectPropertiesWhere(obj, (prop) => {
        const key = getObjectPropertyKeyName(prop)
        return key !== null && propertyNames.has(key)
    })

/**
 * Removes every property from `obj` that satisfies `predicate`. Returns true
 * if any property was removed. Use this over `removeObjectProperties` when
 * removal needs to inspect the property value (not just the key name) —
 * e.g. "remove `driver` only when its value is `require("expo-sqlite")`".
 */
export const removeObjectPropertiesWhere = (
    obj: ObjectExpression,
    predicate: (prop: ObjectExpression["properties"][number]) => boolean,
): boolean => {
    const original = obj.properties.length
    obj.properties = obj.properties.filter((prop) => !predicate(prop))
    return obj.properties.length !== original
}

/**
 * Finds imports from a module, removes the specified named import specifiers,
 * and removes the entire import declaration if no specifiers remain.
 * Returns true if any specifiers were removed.
 */
export const removeImportSpecifiers = (
    root: Collection,
    j: JSCodeshift,
    moduleName: string,
    specifierNames: Set<string>,
): boolean => {
    let removed = false

    root.find(j.ImportDeclaration, {
        source: { value: moduleName },
    }).forEach((importPath) => {
        const remaining = importPath.node.specifiers?.filter((spec) => {
            if (
                spec.type === "ImportSpecifier" &&
                spec.imported.type === "Identifier" &&
                specifierNames.has(spec.imported.name)
            ) {
                removed = true
                return false
            }
            return true
        })

        if (remaining?.length === 0) {
            j(importPath).remove()
        } else if (remaining) {
            importPath.node.specifiers = remaining
        }
    })

    return removed
}

// Returns true for `"moduleName"` and any sub-path like `"moduleName/..."`.
// Used so re-export helpers can match `export { X } from "typeorm"` as well
// as `export { SapConnectionOptions } from "typeorm/driver/sap/SapConnectionOptions"`.
const matchesModuleOrSubPath = (source: unknown, moduleName: string): boolean =>
    typeof source === "string" &&
    (source === moduleName || source.startsWith(`${moduleName}/`))

/**
 * Finds re-exports from a module (`export { X } from "module"`) and removes
 * the named specifiers listed in `specifierNames`. Also matches sub-path
 * re-exports (`export { X } from "module/sub/path"`). Removes the entire
 * `ExportNamedDeclaration` if no specifiers remain. Returns true if any
 * specifiers were removed.
 */
export const removeReExportSpecifiers = (
    root: Collection,
    j: JSCodeshift,
    moduleName: string,
    specifierNames: Set<string>,
): boolean => {
    let removed = false

    root.find(j.ExportNamedDeclaration).forEach((exportPath) => {
        const source = exportPath.node.source?.value
        if (!matchesModuleOrSubPath(source, moduleName)) return

        const remaining = exportPath.node.specifiers?.filter((spec) => {
            if (
                spec.type === "ExportSpecifier" &&
                spec.local?.type === "Identifier" &&
                specifierNames.has(spec.local.name)
            ) {
                removed = true
                return false
            }
            return true
        })

        if (remaining?.length === 0) {
            j(exportPath).remove()
        } else if (remaining) {
            exportPath.node.specifiers = remaining
        }
    })

    return removed
}

/**
 * Finds re-exports from a module (`export { X } from "module"`) and renames
 * specifiers according to the `renames` map. Also matches sub-path
 * re-exports (`export { X } from "module/sub/path"`). When the re-export has
 * an alias (`export { X as Y }`), only the local name is renamed so
 * downstream consumers continue to see the same exported name. Returns true
 * if any specifiers were renamed.
 */
export const renameReExportSpecifiers = (
    root: Collection,
    j: JSCodeshift,
    moduleName: string,
    renames: Record<string, string>,
): boolean => {
    let renamed = false

    root.find(j.ExportNamedDeclaration).forEach((exportPath) => {
        const source = exportPath.node.source?.value
        if (!matchesModuleOrSubPath(source, moduleName)) return

        exportPath.node.specifiers?.forEach((spec) => {
            if (
                spec.type !== "ExportSpecifier" ||
                spec.local?.type !== "Identifier"
            ) {
                return
            }
            const newName = renames[spec.local.name]
            if (!newName) return

            const wasAlias =
                spec.exported.type === "Identifier" &&
                spec.exported.name !== spec.local.name

            spec.local.name = newName
            if (!wasAlias && spec.exported.type === "Identifier") {
                spec.exported.name = newName
            }
            renamed = true
        })
    })

    return renamed
}

/**
 * Finds CallExpression nodes with a MemberExpression callee where the
 * property matches `oldName`, and renames the property to `newName`.
 * Returns true if any were renamed.
 */
export const renameMemberMethod = (
    root: Collection,
    j: JSCodeshift,
    oldName: string,
    newName: string,
): boolean => {
    let renamed = false

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { name: oldName },
        },
    }).forEach((path) => {
        if (
            path.node.callee.type === "MemberExpression" &&
            path.node.callee.property.type === "Identifier"
        ) {
            path.node.callee.property.name = newName
            renamed = true
        }
    })

    return renamed
}
