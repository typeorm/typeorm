import type { ASTNode, ASTPath, Collection, JSCodeshift } from "jscodeshift"

/**
 * Extracts a string value from a StringLiteral or Literal node.
 * Returns null if the node is not a string literal.
 */
export const getStringValue = (node: ASTNode): string | null => {
    if (node.type === "StringLiteral") {
        return (node as ASTNode & { value: string }).value
    }

    if (
        node.type === "Literal" &&
        typeof (node as ASTNode & { value: unknown }).value === "string"
    ) {
        return (node as ASTNode & { value: string }).value
    }

    return null
}

/**
 * Sets the string value on a StringLiteral or Literal node.
 */
export const setStringValue = (node: ASTNode, value: string): void => {
    if (node.type === "StringLiteral" || node.type === "Literal") {
        ;(node as ASTNode & { value: string }).value = value
    }
}

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
 * Traverses ClassProperty decorators and calls `callback` for each
 * ObjectExpression argument found in decorator call expressions.
 *
 * This avoids duplicating the decorator-traversal boilerplate across
 * multiple transforms.
 */
export const forEachDecoratorObjectArg = (
    root: Collection,
    j: JSCodeshift,
    callback: (objectExpression: ASTNode, path: ASTPath) => void,
): void => {
    root.find(j.ClassProperty).forEach((path) => {
        const node = path.node as ASTNode & {
            decorators?: { type: string; expression: ASTNode }[]
        }
        const decorators = node.decorators
        if (!decorators) return

        for (const decorator of decorators) {
            if (
                decorator.type !== "Decorator" ||
                (decorator.expression as ASTNode & { type: string }).type !==
                    "CallExpression"
            ) {
                continue
            }

            const expr = decorator.expression as ASTNode & {
                arguments: ASTNode[]
            }
            for (const arg of expr.arguments) {
                if (arg.type !== "ObjectExpression") continue
                callback(arg, path)
            }
        }
    })
}
