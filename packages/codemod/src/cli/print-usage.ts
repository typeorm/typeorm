import { versions } from "../transforms"

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`
const blue = (s: string) => `\x1b[94m${s}\x1b[0m`

export const printUsage = (): void => {
    const versionList = Object.entries(versions)
        .map(
            ([name, { description }]) =>
                `  ${blue(name.padEnd(6))}${description}`,
        )
        .join("\n")

    console.log(`${bold("Usage:")} @typeorm/codemod ${blue("<version>")} [options] <paths...>

${bold("Versions:")}
${versionList}

${bold("Options:")}
  ${blue("--transform, -t")} <name>  Run a specific transform only
  ${blue("--dry, -d")}               Dry run ${dim("(show changes without writing)")}
  ${blue("--list, -l")}              List available transforms
  ${blue("--help, -h")}              Show this help

${bold("Examples:")}
  ${dim("@typeorm/codemod v1 src/")}
  ${dim("@typeorm/codemod v1 --transform rename-find-by-ids src/")}
  ${dim("@typeorm/codemod v1 --dry src/")}
  ${dim("@typeorm/codemod v1 --list")}`)
}
