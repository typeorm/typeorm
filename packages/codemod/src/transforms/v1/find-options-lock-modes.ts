import path from "node:path"
import type {
    API,
    ASTNode,
    ASTPath,
    FileInfo,
    ObjectExpression,
    ObjectProperty,
    Property,
} from "jscodeshift"
import { fileImportsFrom, getStringValue, setStringValue } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "replace deprecated pessimistic lock modes"

export const findOptionsLockModes = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

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

        setStringValue(arg, replacement.mode)

        const setOnLocked = j.callExpression(
            j.memberExpression(path.node, j.identifier("setOnLocked")),
            [j.stringLiteral(replacement.onLocked)],
        )

        j(path).replaceWith(setOnLocked)
        hasChanges = true
    })

    // Handle find options: { lock: { mode: "pessimistic_partial_write" } }
    // → { lock: { mode: "pessimistic_write", onLocked: "skip_locked" } }
    // Match both Property (Esprima) and ObjectProperty (Babel) node shapes.
    const keyNameOf = (key: ASTNode): string | null =>
        key.type === "Identifier" ? key.name : getStringValue(key)

    const visitModeProperty = (astPath: ASTPath<Property | ObjectProperty>) => {
        if (keyNameOf(astPath.node.key) !== "mode") return

        const value = getStringValue(astPath.node.value)
        if (!value || !lockModeMap[value]) return

        if (astPath.parent.node.type !== "ObjectExpression") return
        const lockObj: ObjectExpression = astPath.parent.node

        const grandparent: Property | ObjectProperty | ASTNode =
            astPath.parent.parent.node
        if (
            grandparent.type !== "Property" &&
            grandparent.type !== "ObjectProperty"
        ) {
            return
        }
        if (keyNameOf(grandparent.key) !== "lock") return

        const replacement = lockModeMap[value]

        setStringValue(astPath.node.value, replacement.mode)

        const hasOnLocked = lockObj.properties.some(
            (p) =>
                (p.type === "Property" || p.type === "ObjectProperty") &&
                keyNameOf(p.key) === "onLocked",
        )

        if (!hasOnLocked) {
            // Use `objectProperty` (Babel builder) rather than `property` so
            // the injected node matches the sibling nodes produced by the
            // `tsx` parser — avoids mixing `Property` and `ObjectProperty`
            // inside the same `ObjectExpression.properties` array.
            lockObj.properties.push(
                j.objectProperty(
                    j.identifier("onLocked"),
                    j.stringLiteral(replacement.onLocked),
                ),
            )
        }

        hasChanges = true
    }

    root.find(j.Property).forEach(visitModeProperty)
    root.find(j.ObjectProperty).forEach(visitModeProperty)

    return hasChanges ? root.toSource() : undefined
}

export const fn = findOptionsLockModes
export default fn
