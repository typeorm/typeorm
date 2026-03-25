import { colors } from "../lib/colors"
import { versions } from "../transforms"

export const listTransforms = (version: string): void => {
    const info = versions[version]
    if (!info) {
        throw new Error(`No transforms found for version "${version}"`)
    }

    const entries = info.transforms
    const hasManual = entries.some((t) => t.manual)

    const maxLen = Math.max(
        ...entries.map((e) => e.name.length + (e.manual ? 4 : 0)),
    )

    console.log(`Available transforms for version ${colors.blue(version)}:\n`)

    for (const { name, description, manual } of entries) {
        const marker = manual ? ` ${colors.yellow("(*)")}` : ""
        const rawLen = name.length + (manual ? 4 : 0)
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
