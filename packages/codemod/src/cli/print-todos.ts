import { colors } from "../lib/colors"

export const printTodos = (allTodos: Map<string, string[]>): void => {
    console.log(`\n  ${colors.yellow("Files requiring manual review:")}`)
    for (const [transform, files] of allTodos) {
        console.log(`    ${colors.dim(transform)}:`)
        files.forEach((f) => console.log(`      ${f}`))
    }
}
