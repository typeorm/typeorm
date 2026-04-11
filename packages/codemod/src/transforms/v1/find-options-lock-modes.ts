import path from "node:path"
import type { API, FileInfo, ObjectExpression } from "jscodeshift"
import { getStringValue, setStringValue } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "replace deprecated pessimistic lock modes"

export const findOptionsLockModes = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    const lockModeMap: Record<string, { mode: string; onLocked: string }> = {
        pessimistic_partial_write: {
            mode: "pessimistic_write",
            onLocked: "skip_locked",
        },
        pessimistic_write_or_fail: {
            mode: "pessimistic_write",
            onLocked: "nowait",
        },
    }

    // Handle .setLock("pessimistic_partial_write") → .setLock("pessimistic_write").setOnLocked("skip_locked")
    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { name: "setLock" },
        },
    }).forEach((path) => {
        const arg = path.node.arguments[0]
        if (!arg) return

        const value = getStringValue(arg)
        if (!value || !lockModeMap[value]) return

        const replacement = lockModeMap[value]

        // Change the lock mode argument
        setStringValue(arg, replacement.mode)

        // Wrap in .setOnLocked() call
        const setOnLocked = j.callExpression(
            j.memberExpression(path.node, j.identifier("setOnLocked")),
            [j.stringLiteral(replacement.onLocked)],
        )

        j(path).replaceWith(setOnLocked)
        hasChanges = true
    })

    // Handle find options: { lock: { mode: "pessimistic_partial_write" } }
    // → { lock: { mode: "pessimistic_write", onLocked: "skip_locked" } }
    root.find(j.ObjectProperty, {
        key: { name: "mode" },
    }).forEach((path) => {
        const value = getStringValue(path.node.value)
        if (!value || !lockModeMap[value]) return

        // Check parent is a lock options object
        if (path.parent.node.type !== "ObjectExpression") return
        const lockObj: ObjectExpression = path.parent.node

        const grandparent = path.parent.parent
        if (
            grandparent.node.type !== "Property" ||
            grandparent.node.key.type !== "Identifier" ||
            grandparent.node.key.name !== "lock"
        ) {
            return
        }

        const replacement = lockModeMap[value]

        // Update mode value
        setStringValue(path.node.value, replacement.mode)

        // Add onLocked property to the lock object
        const hasOnLocked = lockObj.properties.some(
            (p: ObjectExpression["properties"][number]) =>
                p.type === "Property" &&
                p.key.type === "Identifier" &&
                p.key.name === "onLocked",
        )

        if (!hasOnLocked) {
            lockObj.properties.push(
                j.property(
                    "init",
                    j.identifier("onLocked"),
                    j.stringLiteral(replacement.onLocked),
                ),
            )
        }

        hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = findOptionsLockModes
export default fn
