export interface CliOptions {
    version: string
    paths: string[]
    transform?: string
    dry?: boolean
    list?: boolean
    workers?: number
    ignore?: string[]
}

const requireValue = (flag: string, value: string | undefined): string => {
    if (!value || value.startsWith("-")) {
        console.error(`Error: ${flag} requires a value`)
        process.exit(1)
    }

    return value
}

export const parseArgs = (args: string[]): CliOptions => {
    const options: CliOptions = {
        version: "",
        paths: [],
    }

    let i = 0
    while (i < args.length) {
        const arg = args[i]
        if (arg === "--dry" || arg === "-d") {
            options.dry = true
        } else if (arg === "--list" || arg === "-l") {
            options.list = true
        } else if (arg === "--transform" || arg === "-t") {
            options.transform = requireValue(arg, args[++i])
        } else if (arg === "--workers" || arg === "-w") {
            const raw = requireValue(arg, args[++i])
            const value = Number.parseInt(raw, 10)
            if (!Number.isInteger(value) || value <= 0) {
                console.error(
                    `Error: --workers must be a positive integer, got "${raw}"`,
                )
                process.exit(1)
            }
            options.workers = value
        } else if (arg === "--ignore" || arg === "-i") {
            options.ignore ??= []
            options.ignore.push(requireValue(arg, args[++i]))
        } else if (options.version) {
            options.paths.push(arg)
        } else {
            options.version = arg
        }
        i++
    }

    return options
}
