import { versions } from "../transforms"

export const printUsage = (): void => {
    const versionList = Object.entries(versions)
        .map(([name, { description }]) => `  ${name.padEnd(6)}${description}`)
        .join("\n")

    console.log(`Usage: typeorm-codemod <version> [options] <paths...>

Versions:
${versionList}

Options:
  --transform, -t <name>  Run a specific transform only
  --dry, -d               Dry run (show changes without writing)
  --list, -l              List available transforms
  --help, -h              Show this help

Examples:
  typeorm-codemod v1 src/
  typeorm-codemod v1 --transform rename-find-by-ids src/
  typeorm-codemod v1 --dry src/
  typeorm-codemod v1 --list`)
}
