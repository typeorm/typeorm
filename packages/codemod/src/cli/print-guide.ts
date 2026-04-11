import { colors } from "../lib/colors"
import { highlight } from "../lib/highlight"
import { versions } from "../transforms"

export const printGuide = (version: string): void => {
    console.log(
        highlight(
            `\n${colors.blue("Tip:")} run your project's formatter (e.g. \`prettier\`, \`eslint --fix\`) to clean up any style differences introduced by the codemod.`,
        ),
    )

    const guide = versions[version]?.upgradingGuide
    if (guide) {
        console.log(
            `\nSee the full upgrading guide for details: ${colors.blue(guide)}`,
        )
    }
}
