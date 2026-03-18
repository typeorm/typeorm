import path from "node:path"
import { run as jscodeshift } from "jscodeshift/src/Runner"
import { colors } from "./colors"
import { collectTodos } from "../transforms/todo"

export const runTransforms = async (
    transforms: string[],
    paths: string[],
    dry: boolean,
): Promise<void> => {
    const ext = transforms[0]?.endsWith(".ts") ? ".ts" : ".js"
    const allTodos = new Map<string, string[]>()

    for (const transform of transforms) {
        const name = path.basename(transform, ext)
        console.log(`\nRunning transform: ${name}`)

        const result = await jscodeshift(transform, paths, {
            dry,
            print: false,
            verbose: 0,
            extensions: "ts,tsx,js,jsx",
            parser: "tsx",
        })

        for (const [transform, files] of collectTodos(result.stats ?? {})) {
            const existing = allTodos.get(transform) ?? []
            existing.push(...files)
            allTodos.set(transform, existing)
        }
    }

    if (!dry && allTodos.size > 0) {
        console.log(
            `\n${colors.yellow("Warning:")} the following files contain TODO comments that need manual review:\n`,
        )

        for (const [transform, files] of allTodos) {
            console.log(`  ${colors.dim(transform)}:`)
            files.forEach((f) => console.log(`    ${f}`))
        }

        console.log()
    }
}
