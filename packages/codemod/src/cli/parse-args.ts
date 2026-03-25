export interface CliOptions {
    version: string
    paths: string[]
    transform?: string
    dry?: boolean
    list?: boolean
    workers?: number
    ignore?: string[]
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
            options.transform = args[++i]
        } else if (arg === "--workers" || arg === "-w") {
            options.workers = parseInt(args[++i], 10)
        } else if (arg === "--ignore" || arg === "-i") {
            if (!options.ignore) options.ignore = []
            options.ignore.push(args[++i])
        } else if (options.version) {
            options.paths.push(arg)
        } else {
            options.version = arg
        }
        i++
    }

    return options
}
