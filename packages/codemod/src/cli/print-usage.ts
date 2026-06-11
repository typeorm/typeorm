import { colors } from "../lib/colors"
import { versions } from "../transforms"

export const printUsage = (): void => {
    const versionList = Object.entries(versions)
        .map(
            ([name, { description }]) =>
                `  ${colors.blue(name.padEnd(6))}${description}`,
        )
        .join("\n")

    console.log(`${colors.bold("Usage:")} @typeorm/codemod ${colors.blue("<version>")} [options] <paths...>

${colors.bold("Versions:")}
${versionList}

${colors.bold("Options:")}
  ${colors.blue("--dry, -d")}               Dry run ${colors.dim("(show changes without writing)")}
  ${colors.blue("--help, -h")}              Show this help
  ${colors.blue("--ignore, -i")} <pattern>  Additional glob pattern to exclude ${colors.dim("(repeatable; *.d.ts is always excluded)")}
  ${colors.blue("--list, -l")}              List available transforms
  ${colors.blue("--transform, -t")} <name>  Run a specific transform only
  ${colors.blue("--version, -v")}           Print the installed @typeorm/codemod version
  ${colors.blue("--workers, -w")} <num>     Number of worker processes ${colors.dim("(default: CPU cores - 1)")}

${colors.bold("Examples:")}
  ${colors.dim("@typeorm/codemod v1 src/")}
  ${colors.dim("@typeorm/codemod v1 --dry src/")}
  ${colors.dim("@typeorm/codemod v1 --ignore '**/generated*' src/")}
  ${colors.dim("@typeorm/codemod v1 --transform connection-to-datasource src/")}
  ${colors.dim("@typeorm/codemod v1 --list")}`)
}
