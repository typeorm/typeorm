import { colors } from "./colors"

export const printTodos = (allTodos: Map<string, string[]>): void => {
    console.log(
        `\n${colors.yellow("Warning:")} the following files contain TODO comments that need manual review:\n`,
    )
    for (const [transform, files] of allTodos) {
        console.log(`  ${colors.dim(transform)}:`)
        files.forEach((f) => console.log(`    ${f}`))
    }
    console.log()
}
