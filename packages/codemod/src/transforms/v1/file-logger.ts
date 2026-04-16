import path from "node:path"
import type { API, FileInfo, Node, ObjectExpression } from "jscodeshift"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag `new FileLogger()` usages with non-absolute `logPath` — path is now resolved from `process.cwd()` instead of app root"
export const manual = true

const isAbsolutePath = (literal: string): boolean =>
    literal.startsWith("/") || /^[A-Za-z]:[\\/]/.test(literal)

const inspectOptionsArg = (
    argNode: Node | undefined,
): { hasOption: boolean; isAbsolute: boolean } => {
    if (!argNode || argNode.type !== "ObjectExpression") {
        return { hasOption: false, isAbsolute: false }
    }

    for (const prop of (argNode as ObjectExpression).properties) {
        if (
            prop.type !== "ObjectProperty" ||
            prop.key.type !== "Identifier" ||
            prop.key.name !== "logPath"
        ) {
            continue
        }

        const value = prop.value
        if (value.type === "StringLiteral") {
            return { hasOption: true, isAbsolute: isAbsolutePath(value.value) }
        }

        if (
            value.type === "Literal" &&
            typeof (value as { value: unknown }).value === "string"
        ) {
            return {
                hasOption: true,
                isAbsolute: isAbsolutePath((value as { value: string }).value),
            }
        }

        // Non-literal value (template literal, function call like path.resolve, etc.) —
        // assume the user knows what they're doing and don't flag it
        return { hasOption: true, isAbsolute: true }
    }

    return { hasOption: false, isAbsolute: false }
}

export const fileLogger = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    const message =
        "`FileLogger` now resolves `logPath` from `process.cwd()` instead of the app root — use an absolute path if the app is not started from its root folder"

    root.find(j.NewExpression, {
        callee: { type: "Identifier", name: "FileLogger" },
    }).forEach((path) => {
        const optionsArg = path.node.arguments[1]
        const { hasOption, isAbsolute } = inspectOptionsArg(
            optionsArg as Node | undefined,
        )

        // Skip if user explicitly provided an absolute logPath
        if (hasOption && isAbsolute) return

        // Walk up to find the enclosing statement for the TODO comment
        let current = path.parent
        while (current) {
            const node: Node = current.node
            if (
                node.type === "ExpressionStatement" ||
                node.type === "VariableDeclaration" ||
                node.type === "ReturnStatement"
            ) {
                addTodoComment(node, message, j)
                hasChanges = true
                hasTodos = true
                break
            }
            current = current.parent
        }
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = fileLogger
export default fn
