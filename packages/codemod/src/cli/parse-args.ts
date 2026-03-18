export interface CliOptions {
    version: string
    paths: string[]
    transform?: string
    dry?: boolean
    list?: boolean
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
        } else if (options.version) {
            options.paths.push(arg)
        } else {
            options.version = arg
        }
        i++
    }

    return options
}
