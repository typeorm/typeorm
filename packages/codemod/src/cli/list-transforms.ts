import path from "node:path"
import { colors } from "./colors"
import { versions } from "../transforms"
import { getTransformDir, getTransformNames } from "../transforms/scan"

export const listTransforms = (version: string): void => {
    if (!versions[version]) {
        throw new Error(`No transforms found for version "${version}"`)
    }

    const versionDir = getTransformDir(version)
    const names = getTransformNames(version)

    let hasManual = false

    const entries = names.map((name) => {
        const ext = __filename.endsWith(".ts") ? ".ts" : ".js"
        const mod = require(path.join(versionDir, `${name}${ext}`))
        const isManual = !!mod.manual
        if (isManual) hasManual = true
        return { name, description: mod.description || "", isManual }
    })

    const maxLen = Math.max(
        ...entries.map((e) => e.name.length + (e.isManual ? 4 : 0)),
    )

    console.log(`Available transforms for version ${colors.blue(version)}:\n`)

    for (const { name, description, isManual } of entries) {
        const marker = isManual ? ` ${colors.yellow("(*)")}` : ""
        const rawLen = name.length + (isManual ? 4 : 0)
        const padding = " ".repeat(maxLen - rawLen)
        const desc = description ? `${padding} - ${description}` : ""
        console.log(`  ${colors.dim(name)}${marker}${desc}`)
    }

    if (hasManual) {
        console.log(
            `\n  ${colors.yellow("Warning:")} transforms marked with ${colors.yellow("(*)")} require manual review after running`,
        )
    }
}
