#!/usr/bin/env node

import { fail } from "./cli/error"
import { parseArgs } from "./cli/parse-args"
import { printUsage } from "./cli/print-usage"
import { listTransforms } from "./cli/list-transforms"
import { resolveTransforms } from "./transforms/resolve"
import { runTransforms } from "./cli/run"
import { versions } from "./transforms"

const main = async () => {
    const args = process.argv.slice(2)

    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        printUsage()
        return
    }

    const options = parseArgs(args)

    if (!options.version) {
        fail("no version specified", printUsage)
    }

    if (!versions[options.version]) {
        fail(`unknown version "${options.version}"`, printUsage)
    }

    if (options.list) {
        listTransforms(options.version)
        return
    }

    if (options.paths.length === 0) {
        fail("no paths specified", printUsage)
    }

    const transforms = resolveTransforms(options.version, options.transform)
    await runTransforms(
        transforms,
        options.paths,
        options.dry || false,
        options.version,
        options.workers,
        options.stats || false,
    )
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
