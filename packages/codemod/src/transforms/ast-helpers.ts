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
            const localName: string =
                prop.value.type === "Identifier"
                    ? prop.value.name
                    : prop.key.name
            localNames.add(localName)
        }
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
    root.find(j.ClassProperty).forEach((path) => {
        // ast-types omits `decorators` from ClassProperty — extend it
        const node = path.node as ClassProperty & {
            decorators?: Decorator[]
        }
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
 * Removes properties matching the given key names from an ObjectExpression.
 * Matches both identifier keys (`name`) and string-literal keys (`"name"`).
 * Returns true if any properties were removed.
 */
export const removeObjectProperties = (
    obj: ObjectExpression,
    propertyNames: Set<string>,
): boolean => {
    const original = obj.properties.length

    obj.properties = obj.properties.filter((prop) => {
        if (prop.type !== "Property" && prop.type !== "ObjectProperty") {
            return true
        }
        const keyName =
            prop.key.type === "Identifier"
                ? prop.key.name
                : getStringValue(prop.key)
        return keyName === null ? true : !propertyNames.has(keyName)
    })

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
