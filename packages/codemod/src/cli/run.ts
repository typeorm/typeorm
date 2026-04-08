import { runTransforms } from "./run-transforms"
import { runDependencies } from "./run-dependencies"
import { printSummary } from "./print-summary"
import { printGuide } from "./print-guide"

export interface RunOptions {
    transforms: string[]
    paths: string[]
    dry: boolean
    version: string
    workers?: number
    ignore?: string[]
}

export const run = async (options: RunOptions): Promise<void> => {
    const { transforms, paths, dry, version, workers, ignore } = options

    const result = await runTransforms({
        transforms,
        paths,
        dry,
        workers,
        ignore,
    })

    const depResult = runDependencies(paths, version, dry)

    printSummary({
        ...result,
        depChanges: depResult?.changes ?? [],
        depWarnings: depResult?.warnings ?? [],
        depErrors: depResult?.errors ?? [],
    })

    printGuide(version)

    if (result.error > 0 || (depResult?.errors.length ?? 0) > 0) {
        process.exitCode = 1
    }
}
