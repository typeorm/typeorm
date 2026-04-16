import path from "node:path"
import type { API, FileInfo, Node, ObjectExpression } from "jscodeshift"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "add `driver: require('expo-sqlite')` to Expo data sources — legacy Expo driver was removed"
export const manual = true

const hasDriverProperty = (obj: ObjectExpression): boolean =>
    obj.properties.some(
        (prop) =>
            prop.type === "ObjectProperty" &&
            prop.key.type === "Identifier" &&
            prop.key.name === "driver",
    )

const isExpoDataSource = (obj: ObjectExpression): boolean =>
    obj.properties.some(
        (prop) =>
            prop.type === "ObjectProperty" &&
            prop.key.type === "Identifier" &&
            prop.key.name === "type" &&
            prop.value.type === "StringLiteral" &&
            prop.value.value === "expo",
    )

export const datasourceExpo = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    const todoMessage =
        "Expo legacy SQLite driver was removed — requires Expo SDK v52+ with the modern async API. `driver: require('expo-sqlite')` has been added automatically."

    root.find(j.ObjectExpression).forEach((p) => {
        const obj = p.node
        if (!isExpoDataSource(obj)) return
        if (hasDriverProperty(obj)) return

        // Append driver: require("expo-sqlite")
        const driverProperty = j.objectProperty(
            j.identifier("driver"),
            j.callExpression(j.identifier("require"), [
                j.stringLiteral("expo-sqlite"),
            ]),
        )
        obj.properties.push(driverProperty)
        hasChanges = true

        // Walk up to the enclosing statement for the TODO comment
        let current = p.parent
        while (current) {
            const node: Node = current.node
            if (
                node.type === "ExpressionStatement" ||
                node.type === "VariableDeclaration" ||
                node.type === "ReturnStatement"
            ) {
                addTodoComment(node, todoMessage, j)
                hasTodos = true
                break
            }
            current = current.parent
        }
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceExpo
export default fn
