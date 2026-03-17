import path from "node:path"
import { run as jscodeshift } from "jscodeshift/src/Runner"

export const runTransforms = async (
    transforms: string[],
    paths: string[],
    dry: boolean,
): Promise<void> => {
    for (const transform of transforms) {
        const name = path.basename(transform, ".js")
        console.log(`\nRunning transform: ${name}`)

        const result = await jscodeshift(transform, paths, {
            dry,
            print: false,
            verbose: 0,
            extensions: "ts,tsx,js,jsx",
            parser: "tsx",
        })

        console.log(
            `  ${result.ok} ok, ${result.skip} skipped, ${result.error} errors, ${result.nochange} unchanged`,
        )
    }
}
