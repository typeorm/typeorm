#!/usr/bin/env node

import { colors } from "./cli/colors"
import { parseArgs } from "./cli/parse-args"
import { printUsage } from "./cli/print-usage"
import { listTransforms } from "./cli/list-transforms"
import { resolveTransforms } from "./cli/resolve-transforms"
import { runTransforms } from "./cli/run"
import { versions } from "./transforms"

const fail = (message: string): never => {
    console.error(colors.red(`Error: ${message}\n`))
    process.exit(1)
}

const main = async () => {
    const args = process.argv.slice(2)

    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        printUsage()
        return
    }

    const options = parseArgs(args)

    if (!options.version) {
        fail("no version specified")
    }

    if (!versions[options.version]) {
        console.error(
            colors.red(`Error: unknown version "${options.version}"\n`),
        )
        printUsage()
        process.exit(1)
    }

    if (options.list) {
        listTransforms(options.version)
        return
    }

    if (options.paths.length === 0) {
        console.error(colors.red("Error: no paths specified\n"))
        printUsage()
        process.exit(1)
    }

    const transforms = resolveTransforms(options.version, options.transform)
    await runTransforms(transforms, options.paths, options.dry || false)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
