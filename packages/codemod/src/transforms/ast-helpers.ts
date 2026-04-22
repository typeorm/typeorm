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
 * Checks whether the file references the given module as an import or a
 * re-export source. Matches the exact module name (`"typeorm"`) and any
 * sub-path (`"typeorm/..."`), and recognizes ESM `import`, ESM
 * `export { X } from "..."` / `export * from "..."`, TypeScript
 * `import = require(...)`, and CommonJS `require(...)` forms so barrel
 * files and `.js`/`.jsx` callers still pass the scope guard.
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

    // ESM: export { X } from "typeorm[/subpath]" / export * from "..."
    // Barrel files that only re-export TypeORM APIs have no import at all,
    // but their re-export source still counts as a reference to the module.
    if (
        root
            .find(j.ExportNamedDeclaration)
            .some((path) => matchesModule(path.node.source?.value))
    ) {
        return true
    }
    if (
        root
            .find(j.ExportAllDeclaration)
            .some((path) => matchesModule(path.node.source?.value))
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
 *
 * Matches both the exact module name and any sub-path — e.g. when moduleName
 * is `"typeorm"`, imports from `"typeorm/metadata/ColumnMetadata"` are also
 * recognised. TypeORM users reach internal types through deep imports, and
 * the codemod must rewrite them regardless of import shape.
 */
export const getLocalNamesForImport = (
    root: Collection,
    j: JSCodeshift,
    moduleName: string,
    importedName: string,
): Set<string> => {
    const localNames = new Set<string>()
    const prefix = `${moduleName}/`
    const matchesModule = (source: unknown): boolean =>
        typeof source === "string" &&
        (source === moduleName || source.startsWith(prefix))

    // ESM: `import { X [as Y] } from "moduleName[/subpath]"`
    root.find(j.ImportDeclaration).forEach((importPath) => {
        if (!matchesModule(importPath.node.source.value)) return
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

    // CommonJS: `const { X [: Y] } = require("moduleName[/subpath]")`
    root.find(j.CallExpression, {
        callee: { type: "Identifier", name: "require" },
    }).forEach((callPath) => {
        const [arg] = callPath.node.arguments
        if (!arg || !matchesModule(getStringValue(arg))) return

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
    const prefix = `${moduleName}/`
    const matchesModule = (source: unknown): boolean =>
        typeof source === "string" &&
        (source === moduleName || source.startsWith(prefix))

    // ESM: `import * as ns from "moduleName[/subpath]"`
    root.find(j.ImportDeclaration).forEach((importPath) => {
        if (!matchesModule(importPath.node.source.value)) return
        for (const spec of importPath.node.specifiers ?? []) {
            if (
                spec.type === "ImportNamespaceSpecifier" &&
                spec.local?.type === "Identifier"
            ) {
                localNames.add(spec.local.name)
            }
        }
    })

    // TypeScript: `import ns = require("moduleName[/subpath]")`
    root.find(j.TSImportEqualsDeclaration).forEach((importPath) => {
        const ref = importPath.node.moduleReference
        if (ref.type !== "TSExternalModuleReference") return
        if (!matchesModule(getStringValue(ref.expression))) return
        if (importPath.node.id?.type === "Identifier") {
            localNames.add(importPath.node.id.name)
        }
    })

    // CommonJS: `const ns = require("moduleName[/subpath]")`
    root.find(j.CallExpression, {
        callee: { type: "Identifier", name: "require" },
    }).forEach((callPath) => {
        const [arg] = callPath.node.arguments
        if (!arg || !matchesModule(getStringValue(arg))) return

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
 * TypeORM `Repository` / `EntityManager` methods that accept a FindOptions
 * object (with `select`/`relations`/`where`/…). Used to scope the
 * `select: [...]` / `relations: [...]` → object-form transforms to
 * arguments passed into these methods. Deliberately excludes the
 * `*By` variants (`findBy`, `findOneBy`, `findOneByOrFail`,
 * `findAndCountBy`, `countBy`) — those accept a plain WHERE object, so
 * rewriting a top-level `select` or `relations` key there would mangle
 * matches against entity fields of those names.
 *
 * The method-name check (rather than a file-level typeorm import gate)
 * lets the transforms fire in NestJS-style service files that only pull
 * TypeORM types via a wrapper module.
 */
export const TYPEORM_FIND_OPTIONS_METHODS: ReadonlySet<string> = new Set([
    "find",
    "findAndCount",
    "findOne",
    "findOneOrFail",
    "count",
])

/**
 * Returns true when `node` is a call of shape `Object.fromEntries(...)`.
 * Used by the find-option transforms to stay idempotent — a second pass
 * must not wrap an already-wrapped dynamic value in another `fromEntries`.
 */
export const isObjectFromEntriesCall = (node: ASTNode): boolean => {
    if (node.type !== "CallExpression") return false
    const callee = (node as { callee: ASTNode }).callee
    if (callee.type !== "MemberExpression") return false
    const m = callee as { object: ASTNode; property: ASTNode }
    return (
        m.object.type === "Identifier" &&
        m.object.name === "Object" &&
        m.property.type === "Identifier" &&
        m.property.name === "fromEntries"
    )
}

/**
 * Returns true when the given `ObjectProperty` lives inside an object that
 * is an argument to one of the TYPEORM_FIND_OPTIONS_METHODS. Matches both
 *   `repo.find({ select: [...] })` (object is the single argument) and
 *   `manager.find(Entity, { select: [...] })` (object is the second arg).
 */
export const isFindMethodCallArgument = (
    propPath: ASTPath<ASTNode>,
): boolean => {
    const objExprPath = propPath.parent
    if (objExprPath?.node.type !== "ObjectExpression") {
        return false
    }
    // Walk up through TS expression wrappers (`{ select: [...] } as T`,
    // `satisfies Opts`, parens) before expecting a CallExpression. Without
    // this, `repo.find({ select: [...] } as FindOptions)` is missed.
    let ancestor = objExprPath.parent as {
        node: ASTNode
        parent: unknown
    } | null
    while (ancestor) {
        const t = ancestor.node.type
        if (
            t === "TSAsExpression" ||
            t === "TSSatisfiesExpression" ||
            t === "TSTypeAssertion" ||
            t === "TSNonNullExpression" ||
            t === "ParenthesizedExpression"
        ) {
            ancestor = ancestor.parent as {
                node: ASTNode
                parent: unknown
            } | null
            continue
        }
        break
    }
    if (!ancestor) return false
    const callNode = ancestor.node
    if (
        callNode.type !== "CallExpression" &&
        callNode.type !== "OptionalCallExpression"
    ) {
        return false
    }
    const callee = (callNode as { callee: ASTNode }).callee
    if (
        callee.type !== "MemberExpression" &&
        callee.type !== "OptionalMemberExpression"
    ) {
        return false
    }
    const prop = (callee as { property: ASTNode }).property
    if (prop.type !== "Identifier") return false
    return TYPEORM_FIND_OPTIONS_METHODS.has(prop.name)
}

/**
 * Peels TypeScript expression wrappers and parenthesized expressions around
 * a value so callers see the underlying node. Handles `as X` / `x!` /
 * `x satisfies X` / `<X>x` / `(x)`. Used by transforms that inspect values
 * which users may annotate with type assertions — e.g.
 * `type: "expo" as const`, `type: ("mongodb")`,
 * `{ logPath: "x" } as Options`.
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
        current.type === "TSTypeAssertion" ||
        current.type === "ParenthesizedExpression"
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

/**
 * Walks a TypeScript type-annotation node and returns the root identifier
 * name — e.g. `Repository<User>` → `"Repository"`, `Repository<User> | null`
 * → `"Repository"`, `typeof Repository` → `"Repository"`. Returns null when
 * the annotation doesn't root on a TSTypeReference with an Identifier name.
 *
 * When `typeormNamespaceNames` is passed, qualified references like
 * `ns.Repository<User>` are only returned if `ns` is one of the provided
 * namespace locals — otherwise the qualified reference is rejected so that
 * unrelated namespaces (`Foo.Repository<T>` from some-other-lib) are not
 * mistaken for TypeORM types. Without the parameter, any qualifier is
 * accepted, which matches legacy callers that don't care about provenance.
 */
// Walks the members of a union/intersection type and prefers the first
// TypeORM-family name (so `FooBar | Repository<T>` or `null | Repository<T>`
// classify correctly). Falls back to the first non-null root name to keep
// pre-existing behavior for callers that don't care about TypeORM gating.
const findUnionOrIntersectionRoot = (
    types: ASTNode[],
    typeormNamespaceNames?: ReadonlySet<string>,
): string | null => {
    let firstName: string | null = null
    for (const member of types) {
        const name = getTypeReferenceRootName(member, typeormNamespaceNames)
        if (!name) continue
        if (
            TYPEORM_REPOSITORY_TYPES.has(name) ||
            TYPEORM_DATASOURCE_TYPES.has(name)
        ) {
            return name
        }
        firstName ??= name
    }
    return firstName
}

// Returns the rightmost segment of a `TSQualifiedName` (`a.b.c` in type
// position) — always an `Identifier` in valid TS, since the nesting lives
// on `.left`. When `typeormNamespaceNames` is provided, the leftmost segment
// is checked against the set of typeorm namespace locals and the rightmost
// name is only returned if the qualifier matches — so `typeorm.Repository`
// resolves to `"Repository"` while `other.Repository` returns null, avoiding
// false-positive classification of identically-named types from other
// modules. Without the parameter, any qualifier is accepted (legacy
// behaviour for callers that only look at the rightmost segment).
const getQualifiedNameRightmost = (
    node: ASTNode,
    typeormNamespaceNames?: ReadonlySet<string>,
): string | null => {
    const n = node as { left: ASTNode; right: ASTNode }
    if (n.right.type !== "Identifier") return null

    if (typeormNamespaceNames !== undefined) {
        // Walk down `.left` to the leftmost identifier (qualifier root).
        let leftmost: ASTNode = n.left
        while (leftmost.type === "TSQualifiedName") {
            leftmost = (leftmost as { left: ASTNode }).left
        }
        if (leftmost.type !== "Identifier") return null
        if (!typeormNamespaceNames.has(leftmost.name)) return null
    }

    return n.right.name
}

export const getTypeReferenceRootName = (
    node: ASTNode | null,
    typeormNamespaceNames?: ReadonlySet<string>,
): string | null => {
    if (!node) return null
    if (node.type === "TSTypeReference") {
        const n = node as { typeName: ASTNode }
        if (n.typeName.type === "Identifier") {
            return n.typeName.name
        }
        // `typeorm.Repository<User>` — TSTypeReference wraps a TSQualifiedName
        // (namespace-import access). Without this branch,
        // `import * as typeorm from "typeorm"` callers would be missed.
        if (n.typeName.type === "TSQualifiedName") {
            return getQualifiedNameRightmost(n.typeName, typeormNamespaceNames)
        }
    }
    // `const X: typeof Repository` — TSTypeQuery wraps the referenced
    // identifier in `exprName`. Without this branch, type-of annotations on
    // typeorm-family types wouldn't register as repository bindings.
    if (node.type === "TSTypeQuery") {
        const n = node as { exprName: ASTNode }
        if (n.exprName.type === "Identifier") {
            return n.exprName.name
        }
        if (n.exprName.type === "TSQualifiedName") {
            return getQualifiedNameRightmost(n.exprName, typeormNamespaceNames)
        }
    }
    if (node.type === "TSTypeAnnotation") {
        const n = node as { typeAnnotation: ASTNode }
        return getTypeReferenceRootName(n.typeAnnotation, typeormNamespaceNames)
    }
    if (node.type === "TSUnionType" || node.type === "TSIntersectionType") {
        return findUnionOrIntersectionRoot(
            (node as { types: ASTNode[] }).types,
            typeormNamespaceNames,
        )
    }
    return null
}

/**
 * TypeORM Repository-family type names used to detect bindings that hold a
 * Repository/EntityManager instance, so transforms can scope method renames
 * (`.findByIds`, `.findOneById`, `.exist`, `.stats`) to those receivers.
 */
export const TYPEORM_REPOSITORY_TYPES: ReadonlySet<string> = new Set([
    "Repository",
    "TreeRepository",
    "MongoRepository",
    "EntityRepository",
    "AbstractRepository",
    "EntityManager",
    "MongoEntityManager",
    "SqljsEntityManager",
])

/**
 * Call shapes whose return value is a Repository/EntityManager:
 *   `.getRepository(...)`, `.getMongoRepository(...)`, `.getTreeRepository(...)`,
 *   `.getCustomRepository(...)`, `.manager` (property access, see caller).
 */
const REPOSITORY_RETURNING_METHODS: ReadonlySet<string> = new Set([
    "getRepository",
    "getMongoRepository",
    "getTreeRepository",
    "getCustomRepository",
])

// Returns true when `node` is a call expression whose callee ends in one of
// the Repository-returning method names (e.g. `ds.getRepository(User)`).
const isRepositoryReturningCall = (node: ASTNode): boolean => {
    if (
        node.type !== "CallExpression" &&
        node.type !== "OptionalCallExpression"
    )
        return false
    const call = node as { callee: ASTNode }
    const callee = call.callee
    if (
        callee.type !== "MemberExpression" &&
        callee.type !== "OptionalMemberExpression"
    )
        return false
    const member = callee as { property: ASTNode; computed?: boolean }
    if (member.property.type === "Identifier") {
        return REPOSITORY_RETURNING_METHODS.has(member.property.name)
    }
    if (member.computed) {
        const name = getStringValue(member.property)
        return name !== null && REPOSITORY_RETURNING_METHODS.has(name)
    }
    return false
}

/**
 * TypeORM DataSource-family type names, recognized on local bindings so
 * `dataSource.manager.X()` can be classified as a Repository receiver via
 * the `.manager` accessor chain.
 */
export const TYPEORM_DATASOURCE_TYPES: ReadonlySet<string> = new Set([
    "DataSource",
    "Connection",
])

/**
 * Scans a file for local bindings that hold a TypeORM Repository/EntityManager
 * instance. Used by method-rename transforms to avoid rewriting unrelated
 * `.method()` calls (e.g. `fs.exist(path)`, `performance.stats()`).
 *
 * Detects:
 *   - `const r = anything.getRepository(User)` (and `Mongo`/`Tree`/`Custom`)
 *   - `const r: Repository<User> = ...` (or other Repository-family types)
 *   - Function parameters with the above type annotations
 *   - Class constructor params with those type annotations
 *   - Class properties with those type annotations (for `this.X` access)
 *   - DataSource-typed bindings (for `ds.manager.X()` receiver classification)
 *
 * Also returns the set of class-property names so callers can recognize
 * `this.repo.method()` access.
 */
interface RepositoryBindings {
    locals: Set<string>
    classProps: Set<string>
    dataSourceLocals: Set<string>
    dataSourceClassProps: Set<string>
}

// Classifies a type name into one of the tracked receiver buckets, or
// returns null when the type isn't a TypeORM receiver we care about.
const classifyRepositoryTypeName = (
    typeName: string,
    bindings: RepositoryBindings,
    forThisMember: boolean,
): Set<string> | null => {
    if (TYPEORM_REPOSITORY_TYPES.has(typeName)) {
        return forThisMember ? bindings.classProps : bindings.locals
    }
    if (TYPEORM_DATASOURCE_TYPES.has(typeName)) {
        return forThisMember
            ? bindings.dataSourceClassProps
            : bindings.dataSourceLocals
    }
    return null
}

// Records a typed identifier (variable / parameter) into the appropriate
// binding bucket based on its TypeScript annotation.
const recordTypedIdentifier = (
    id: ASTNode,
    annotation: ASTNode | null,
    bindings: RepositoryBindings,
    typeormNamespaceNames: ReadonlySet<string>,
): void => {
    if (id.type !== "Identifier") return
    const typeName = getTypeReferenceRootName(annotation, typeormNamespaceNames)
    if (!typeName) return
    const bucket = classifyRepositoryTypeName(typeName, bindings, false)
    bucket?.add(id.name)
}

// Resolves the underlying `Identifier` inside a function parameter — peeling
// `AssignmentPattern` (default params) and `TSParameterProperty` (constructor
// parameter properties). `isParameterProperty` is true only for
// TSParameterProperty, so callers can additionally record it as a
// `this.<name>` class member.
const unwrapParameterIdentifier = (
    param: ASTNode,
): {
    id: ASTNode
    annotation: ASTNode | null
    isParameterProperty: boolean
} | null => {
    if (param.type === "Identifier") {
        return {
            id: param,
            annotation: param.typeAnnotation ?? null,
            isParameterProperty: false,
        }
    }
    if (
        param.type !== "AssignmentPattern" &&
        param.type !== "TSParameterProperty"
    ) {
        return null
    }
    const inner =
        (param as { left?: ASTNode; parameter?: ASTNode }).left ??
        (param as { parameter?: ASTNode }).parameter
    if (inner?.type !== "Identifier") return null
    return {
        id: inner,
        annotation:
            (inner as { typeAnnotation?: ASTNode }).typeAnnotation ?? null,
        isParameterProperty: param.type === "TSParameterProperty",
    }
}

// Scans VariableDeclarators for typed identifiers and initializers that
// return a Repository via `.getRepository()`-family calls.
const collectDeclaratorBindings = (
    root: Collection,
    j: JSCodeshift,
    bindings: RepositoryBindings,
    typeormNamespaceNames: ReadonlySet<string>,
): void => {
    root.find(j.VariableDeclarator).forEach((p) => {
        const id = p.node.id
        if (id.type !== "Identifier") return
        recordTypedIdentifier(
            id,
            id.typeAnnotation ?? null,
            bindings,
            typeormNamespaceNames,
        )
        const init = p.node.init
        if (init && isRepositoryReturningCall(init)) {
            bindings.locals.add(id.name)
        }
    })
    root.find(j.AssignmentExpression).forEach((p) => {
        const left = p.node.left
        if (left.type !== "Identifier") return
        if (!isRepositoryReturningCall(p.node.right)) return
        bindings.locals.add(left.name)
    })
}

// Scans function parameters on every function-like node. TSParameterProperty
// bindings (`constructor(private repo: Repository<T>)`) are tracked in both
// `locals` (for accesses inside the constructor body) AND `classProps` (for
// `this.repo` accesses elsewhere in the class).
const collectFunctionParamBindings = (
    root: Collection,
    j: JSCodeshift,
    bindings: RepositoryBindings,
    typeormNamespaceNames: ReadonlySet<string>,
): void => {
    const visit = (node: { params: ASTNode[] }) => {
        for (const param of node.params) {
            const unwrapped = unwrapParameterIdentifier(param)
            if (!unwrapped) continue
            recordTypedIdentifier(
                unwrapped.id,
                unwrapped.annotation,
                bindings,
                typeormNamespaceNames,
            )
            if (
                unwrapped.isParameterProperty &&
                unwrapped.id.type === "Identifier"
            ) {
                const typeName = getTypeReferenceRootName(
                    unwrapped.annotation,
                    typeormNamespaceNames,
                )
                if (typeName) {
                    const classBucket = classifyRepositoryTypeName(
                        typeName,
                        bindings,
                        true,
                    )
                    classBucket?.add(unwrapped.id.name)
                }
            }
        }
    }
    root.find(j.FunctionDeclaration).forEach((p) => visit(p.node))
    root.find(j.FunctionExpression).forEach((p) => visit(p.node))
    root.find(j.ArrowFunctionExpression).forEach((p) => visit(p.node))
    root.find(j.ClassMethod).forEach((p) => visit(p.node))
    root.find(j.TSDeclareMethod).forEach((p) => visit(p.node))
}

// Scans class properties — `this.<name>` receivers are tracked separately
// from local identifiers because the access shape is different.
const collectClassPropertyBindings = (
    root: Collection,
    j: JSCodeshift,
    bindings: RepositoryBindings,
    typeormNamespaceNames: ReadonlySet<string>,
): void => {
    root.find(j.ClassProperty).forEach((p) => {
        const key = p.node.key
        if (key.type !== "Identifier") return
        const annotation =
            (p.node as { typeAnnotation?: ASTNode }).typeAnnotation ?? null
        const typeName = getTypeReferenceRootName(
            annotation,
            typeormNamespaceNames,
        )
        if (!typeName) return
        const bucket = classifyRepositoryTypeName(typeName, bindings, true)
        bucket?.add(key.name)
    })
}

export const collectRepositoryBindings = (
    root: Collection,
    j: JSCodeshift,
): RepositoryBindings => {
    const bindings: RepositoryBindings = {
        locals: new Set(),
        classProps: new Set(),
        dataSourceLocals: new Set(),
        dataSourceClassProps: new Set(),
    }
    // Qualified type references like `typeorm.Repository<T>` must only be
    // classified as TypeORM receivers when the qualifier is an actual
    // namespace-local of `import * as typeorm from "typeorm"` (or the
    // `import ns = require("typeorm")` variants). Without this gate, a
    // file containing both a typeorm import and `Foo.Repository<T>` from
    // some-other-lib would treat `Foo.Repository`-typed bindings as
    // Repository receivers and mis-rewrite their method calls.
    const typeormNamespaceNames = getNamespaceLocalNames(root, j, "typeorm")
    collectDeclaratorBindings(root, j, bindings, typeormNamespaceNames)
    collectFunctionParamBindings(root, j, bindings, typeormNamespaceNames)
    collectClassPropertyBindings(root, j, bindings, typeormNamespaceNames)
    return bindings
}

/**
 * Returns true when `receiver` is a MemberExpression-eligible node whose
 * root identifier is a Repository-bound local or `this.X` where `X` is a
 * Repository-typed class property. Also accepts fresh inline
 * `.getRepository(...)` call-expression receivers and DataSource-typed
 * bindings dereferenced via `.manager` (e.g. `ds.manager.findByIds(...)`).
 *
 * When the file contains no Repository-typed bindings at all (no typed
 * variables, no `.getRepository()` assignments, no Repository class
 * properties), falls back to permissive matching — the codemod has no
 * type signal and must trust the historical `fileImportsFrom("typeorm")`
 * file-level guard. Callers should add negative fixtures to pin the
 * common false-positive vectors.
 */
// Matches `this.<prop>` where `<prop>` is a tracked DataSource class prop.
const isThisDataSourceProp = (
    node: ASTNode,
    dsClassProps: ReadonlySet<string> | undefined,
): boolean =>
    (node.type === "MemberExpression" ||
        node.type === "OptionalMemberExpression") &&
    (node as { object: ASTNode }).object.type === "ThisExpression" &&
    (node as { property: ASTNode }).property.type === "Identifier" &&
    (dsClassProps?.has(
        ((node as { property: ASTNode }).property as Identifier).name,
    ) ??
        false)

// `<ds>.manager` — DataSource local/class-prop's `.manager` accessor
// returns an EntityManager, whose find-family methods match Repository's.
const isDataSourceManagerChain = (
    member: { object: ASTNode; property: ASTNode },
    dsLocals: ReadonlySet<string> | undefined,
    dsClassProps: ReadonlySet<string> | undefined,
): boolean => {
    if (
        member.property.type !== "Identifier" ||
        member.property.name !== "manager"
    ) {
        return false
    }
    if (
        member.object.type === "Identifier" &&
        (dsLocals?.has(member.object.name) ?? false)
    ) {
        return true
    }
    return isThisDataSourceProp(member.object, dsClassProps)
}

// Classifies MemberExpression / OptionalMemberExpression receivers.
const classifyMemberReceiver = (
    receiver: ASTNode,
    bindings: {
        classProps: ReadonlySet<string>
        dataSourceLocals?: ReadonlySet<string>
        dataSourceClassProps?: ReadonlySet<string>
    },
    noBindingsFound: boolean,
): boolean => {
    const member = receiver as { object: ASTNode; property: ASTNode }
    if (
        isDataSourceManagerChain(
            member,
            bindings.dataSourceLocals,
            bindings.dataSourceClassProps,
        )
    ) {
        return true
    }
    if (
        member.object.type === "ThisExpression" &&
        member.property.type === "Identifier"
    ) {
        if (bindings.classProps.has(member.property.name)) return true
        return noBindingsFound
    }
    // Chained access like `service.userRepo.findByIds(...)` — accept only
    // when we have no binding info to disambiguate.
    return noBindingsFound
}

export const isRepositoryReceiver = (
    receiver: ASTNode,
    bindings: {
        locals: ReadonlySet<string>
        classProps: ReadonlySet<string>
        dataSourceLocals?: ReadonlySet<string>
        dataSourceClassProps?: ReadonlySet<string>
    },
): boolean => {
    const noBindingsFound =
        bindings.locals.size === 0 &&
        bindings.classProps.size === 0 &&
        (bindings.dataSourceLocals?.size ?? 0) === 0 &&
        (bindings.dataSourceClassProps?.size ?? 0) === 0

    if (receiver.type === "Identifier") {
        if (bindings.locals.has(receiver.name)) return true
        return noBindingsFound
    }
    if (
        receiver.type === "MemberExpression" ||
        receiver.type === "OptionalMemberExpression"
    ) {
        return classifyMemberReceiver(receiver, bindings, noBindingsFound)
    }
    if (
        receiver.type === "CallExpression" ||
        receiver.type === "OptionalCallExpression"
    ) {
        if (isRepositoryReturningCall(receiver)) return true
        return noBindingsFound
    }
    return noBindingsFound
}
