#!/usr/bin/env node

import { parseArgs } from "./cli/parse-args"
import { printUsage } from "./cli/print-usage"
import { listTransforms } from "./cli/list-transforms"
import { resolveTransforms } from "./cli/resolve-transforms"
import { runTransforms } from "./cli/run"
import { versions } from "./transforms"

const error = (message: string): never => {
    console.error(`\x1b[31mError: ${message}\x1b[0m`)
    process.exitCode = 1
    return undefined as never
}

const main = async () => {
    const args = process.argv.slice(2)

    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        printUsage()
        return
    }

    const options = parseArgs(args)

    if (!options.version) {
        error("no version specified")
        printUsage()
        return
    }

    if (!versions[options.version]) {
        error(
            `unknown version "${options.version}". Available: ${Object.keys(versions).join(", ")}`,
        )
        return
    }

    if (options.list) {
        listTransforms(options.version)
        return
    }

    if (options.paths.length === 0) {
        error("no paths specified")
        printUsage()
        return
    }

    const transforms = resolveTransforms(options.version, options.transform)
    await runTransforms(transforms, options.paths, options.dry || false)
}

main().catch((err) => {
    console.error(err)
    process.exitCode = 1
})
