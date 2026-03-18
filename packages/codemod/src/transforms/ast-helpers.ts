import type { ASTNode } from "jscodeshift"

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
