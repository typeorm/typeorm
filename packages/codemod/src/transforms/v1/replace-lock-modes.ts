import type { API, FileInfo } from "jscodeshift"

export const description = "replace deprecated pessimistic lock modes"

export const replaceLockModes = (file: FileInfo, api: API) => {
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

        const value =
            arg.type === "StringLiteral"
                ? arg.value
                : arg.type === "Literal" && typeof arg.value === "string"
                  ? arg.value
                  : null

        if (!value || !lockModeMap[value]) return

        const replacement = lockModeMap[value]

        // Change the lock mode argument
        if (arg.type === "StringLiteral") {
            arg.value = replacement.mode
        } else if (arg.type === "Literal") {
            arg.value = replacement.mode
        }

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
        const value =
            path.node.value.type === "StringLiteral"
                ? path.node.value.value
                : path.node.value.type === "Literal" &&
                    typeof path.node.value.value === "string"
                  ? path.node.value.value
                  : null

        if (!value || !lockModeMap[value]) return

        // Check parent is a lock options object
        const parent = path.parent
        if (parent.node.type !== "ObjectExpression") return

        const grandparent = parent.parent
        if (
            grandparent.node.type !== "Property" ||
            grandparent.node.key.type !== "Identifier" ||
            grandparent.node.key.name !== "lock"
        ) {
            return
        }

        const replacement = lockModeMap[value]

        // Update mode value
        if (path.node.value.type === "StringLiteral") {
            path.node.value.value = replacement.mode
        } else if (path.node.value.type === "Literal") {
            path.node.value.value = replacement.mode
        }

        // Add onLocked property to the lock object
        const hasOnLocked = parent.node.properties.some(
            (p: any) =>
                p.type === "Property" &&
                p.key.type === "Identifier" &&
                p.key.name === "onLocked",
        )

        if (!hasOnLocked) {
            parent.node.properties.push(
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

export default replaceLockModes
