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
 * TypeORM `Repository` / `EntityManager` find-family method names. Used to
 * scope find-option transforms (`select: [...]` / `relations: [...]` →
 * object form) to arguments passed into these methods. The method-name
 * check lets the transforms fire on files that import TypeORM only
 * indirectly (through a wrapper service), matching real NestJS-style
 * codebases where service files don't `import` from `typeorm` directly.
 */
export const TYPEORM_FIND_METHODS: ReadonlySet<string> = new Set([
    "find",
    "findAndCount",
    "findAndCountBy",
    "findBy",
    "findOne",
    "findOneBy",
    "findOneByOrFail",
    "findOneOrFail",
    "count",
    "countBy",
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
 * is an argument to one of the TYPEORM_FIND_METHODS. Matches both
 *   `repo.find({ select: [...] })` (object is the single argument) and
 *   `manager.find(Entity, { select: [...] })` (object is the second arg).
 */
export const isFindMethodCallArgument = (
    propPath: ASTPath<ASTNode>,
): boolean => {
    const objExprPath = propPath.parent
    if (!objExprPath || objExprPath.node.type !== "ObjectExpression") {
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
    return TYPEORM_FIND_METHODS.has(prop.name)
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

/**
 * Walks a TypeScript type-annotation node and returns the root identifier
 * name — e.g. `Repository<User>` → `"Repository"`, `Repository<User> | null`
 * → `"Repository"`, `typeof Repository` → `"Repository"`. Returns null when
 * the annotation doesn't root on a TSTypeReference with an Identifier name.
 */
const getTypeReferenceRootName = (node: ASTNode | null): string | null => {
    if (!node) return null
    if (node.type === "TSTypeReference") {
        const n = node as { typeName: ASTNode }
        if (n.typeName.type === "Identifier") {
            return n.typeName.name
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
    }
    if (node.type === "TSTypeAnnotation") {
        const n = node as { typeAnnotation: ASTNode }
        return getTypeReferenceRootName(n.typeAnnotation)
    }
    if (node.type === "TSUnionType" || node.type === "TSIntersectionType") {
        const n = node as { types: ASTNode[] }
        for (const member of n.types) {
            const name = getTypeReferenceRootName(member)
            if (name) return name
        }
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
export const collectRepositoryBindings = (
    root: Collection,
    j: JSCodeshift,
): {
    locals: Set<string>
    classProps: Set<string>
    dataSourceLocals: Set<string>
    dataSourceClassProps: Set<string>
} => {
    const locals = new Set<string>()
    const classProps = new Set<string>()
    const dataSourceLocals = new Set<string>()
    const dataSourceClassProps = new Set<string>()

    // Variable declarators / parameters with matching TS annotation.
    const recordTypedId = (id: ASTNode, annotation: ASTNode | null): void => {
        if (id.type !== "Identifier") return
        const typeName = getTypeReferenceRootName(annotation)
        if (!typeName) return
        if (TYPEORM_REPOSITORY_TYPES.has(typeName)) {
            locals.add(id.name)
        } else if (TYPEORM_DATASOURCE_TYPES.has(typeName)) {
            dataSourceLocals.add(id.name)
        }
    }

    root.find(j.VariableDeclarator).forEach((p) => {
        const id = p.node.id
        if (id.type !== "Identifier") return
        const name = id.name
        const annotation = id.typeAnnotation as ASTNode | null
        recordTypedId(id, annotation)
        const init = p.node.init
        if (init && isRepositoryReturningCall(init)) {
            locals.add(name)
        }
    })

    root.find(j.AssignmentExpression).forEach((p) => {
        const left = p.node.left
        const right = p.node.right
        if (left.type !== "Identifier") return
        if (!isRepositoryReturningCall(right)) return
        locals.add(left.name)
    })

    const recordFunctionParams = (params: ASTNode[]): void => {
        for (const param of params) {
            if (param.type === "Identifier") {
                const annotation = param.typeAnnotation as ASTNode | null
                recordTypedId(param, annotation)
            } else if (
                param.type === "AssignmentPattern" ||
                param.type === "TSParameterProperty"
            ) {
                const inner =
                    (
                        param as unknown as {
                            left?: ASTNode
                            parameter?: ASTNode
                        }
                    ).left ??
                    (param as unknown as { parameter?: ASTNode }).parameter
                if (inner && inner.type === "Identifier") {
                    const annotation = inner.typeAnnotation as ASTNode | null
                    recordTypedId(inner, annotation)
                }
            }
        }
    }

    const visitFunctionLike = (node: { params: ASTNode[] }): void => {
        recordFunctionParams(node.params)
    }
    root.find(j.FunctionDeclaration).forEach((p) => visitFunctionLike(p.node))
    root.find(j.FunctionExpression).forEach((p) => visitFunctionLike(p.node))
    root.find(j.ArrowFunctionExpression).forEach((p) =>
        visitFunctionLike(p.node),
    )
    root.find(j.ClassMethod).forEach((p) => visitFunctionLike(p.node))
    root.find(j.TSDeclareMethod).forEach((p) => visitFunctionLike(p.node))

    root.find(j.ClassProperty).forEach((p) => {
        const key = p.node.key
        if (key.type !== "Identifier") return
        const annotation = (p.node as { typeAnnotation?: ASTNode })
            .typeAnnotation
        const typeName = getTypeReferenceRootName(annotation ?? null)
        if (!typeName) return
        if (TYPEORM_REPOSITORY_TYPES.has(typeName)) {
            classProps.add(key.name)
        } else if (TYPEORM_DATASOURCE_TYPES.has(typeName)) {
            dataSourceClassProps.add(key.name)
        }
    })

    return { locals, classProps, dataSourceLocals, dataSourceClassProps }
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
export const isRepositoryReceiver = (
    receiver: ASTNode,
    bindings: {
        locals: ReadonlySet<string>
        classProps: ReadonlySet<string>
        dataSourceLocals?: ReadonlySet<string>
        dataSourceClassProps?: ReadonlySet<string>
    },
): boolean => {
    const dsLocals = bindings.dataSourceLocals
    const dsClassProps = bindings.dataSourceClassProps
    const noBindingsFound =
        bindings.locals.size === 0 &&
        bindings.classProps.size === 0 &&
        (dsLocals?.size ?? 0) === 0 &&
        (dsClassProps?.size ?? 0) === 0

    if (receiver.type === "Identifier") {
        if (bindings.locals.has(receiver.name)) return true
        return noBindingsFound
    }
    if (
        receiver.type === "MemberExpression" ||
        receiver.type === "OptionalMemberExpression"
    ) {
        const member = receiver as { object: ASTNode; property: ASTNode }

        // `ds.manager` — DataSource local's `.manager` accessor returns an
        // EntityManager, which carries the same find-family methods as
        // Repository. Treat the full chain as a Repository receiver.
        if (
            member.property.type === "Identifier" &&
            member.property.name === "manager"
        ) {
            if (
                member.object.type === "Identifier" &&
                dsLocals?.has(member.object.name)
            ) {
                return true
            }
            if (
                (member.object.type === "MemberExpression" ||
                    member.object.type === "OptionalMemberExpression") &&
                (member.object as { object: ASTNode }).object.type ===
                    "ThisExpression" &&
                (member.object as { property: ASTNode }).property.type ===
                    "Identifier" &&
                dsClassProps?.has(
                    (
                        (member.object as { property: ASTNode })
                            .property as Identifier
                    ).name,
                )
            ) {
                return true
            }
        }

        if (member.object.type === "ThisExpression") {
            if (member.property.type === "Identifier") {
                if (bindings.classProps.has(member.property.name)) return true
                return noBindingsFound
            }
        }
        // Chained access like `service.userRepo.findByIds(...)` — accept
        // only when we have no binding info to disambiguate.
        return noBindingsFound
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
