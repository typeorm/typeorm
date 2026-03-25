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
 * Checks whether the file contains an import from the given module.
 */
export const fileImportsFrom = (
    root: Collection,
    j: JSCodeshift,
    moduleName: string,
): boolean => {
    return (
        root.find(j.ImportDeclaration, {
            source: { value: moduleName },
        }).length > 0
    )
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
 * Traverses ClassProperty decorators and calls `callback` for each
 * ObjectExpression argument found in decorator call expressions.
 *
 * This avoids duplicating the decorator-traversal boilerplate across
 * multiple transforms.
 */
export const forEachDecoratorObjectArg = (
    root: Collection,
    j: JSCodeshift,
    callback: (objectExpression: ObjectExpression, path: ASTPath) => void,
): void => {
    root.find(j.ClassProperty).forEach((path) => {
        // ast-types omits `decorators` from ClassProperty — extend it
        const node = path.node as ClassProperty & {
            decorators?: Decorator[]
        }
        if (!node.decorators) return

        for (const decorator of node.decorators) {
            if (decorator.expression.type !== "CallExpression") continue

            for (const arg of decorator.expression.arguments) {
                if (arg.type !== "ObjectExpression") continue
                callback(arg, path)
            }
        }
    })
}
