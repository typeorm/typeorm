// src/commands/MigrationGenerateCommand.ts
import { format } from "@sqltools/formatter/lib/sqlFormatter"
import ansi from "ansis"
import path from "path"
import process from "process"
import yargs from "yargs"
import { PlatformTools } from "../platform/PlatformTools"
import { camelCase } from "../util/StringUtils"
import { CommandUtils } from "./CommandUtils"

/**
 * Generates a new migration file with SQL needed to update schema.
 */
export class MigrationGenerateCommand implements yargs.CommandModule {
  command = "migration:generate <path>"
  describe =
    "Generates a new migration file with SQL needed to update schema."

  builder(args: yargs.Argv) {
    return args
      .positional("path", {
        type: "string",
        describe: "Path of the migration file",
        demandOption: true,
      })
      .option("dataSource", {
        alias: "d",
        type: "string",
        describe: "Path to the file where your DataSource instance is defined.",
        demandOption: true,
      })
      .option("p", {
        alias: "pretty",
        type: "boolean",
        default: false,
        describe: "Pretty-print generated SQL",
      })
      .option("o", {
        alias: "outputJs",
        type: "boolean",
        default: false,
        describe:
          "Generate a migration file in JavaScript instead of TypeScript",
      })
      .option("esm", {
        type: "boolean",
        default: false,
        describe: "Generate an ESM migration instead of CommonJS",
      })
      .option("dr", {
        alias: "dryrun",
        type: "boolean",
        default: false,
        describe:
          "Prints the migration content instead of writing to file",
      })
      .option("ch", {
        alias: "check",
        type: "boolean",
        default: false,
        describe:
          "Checks for pending schema changes without writing a file",
      })
      .option("t", {
        alias: "timestamp",
        type: "number",
        default: false,
        describe: "Custom timestamp for the migration name",
      })
  }

  async handler(args: yargs.Arguments<any & { path: string }>) {
    const timestamp = CommandUtils.getTimestamp(args.timestamp)
    const extension = args.outputJs ? ".js" : ".ts"
    const fullPath = args.path.startsWith("/")
      ? args.path
      : path.resolve(process.cwd(), args.path)
    const filename = `${timestamp}-${path.basename(fullPath)}${extension}`

    try {
      const dataSource = await CommandUtils.loadDataSource(
        path.resolve(process.cwd(), args.dataSource as string),
      )
      dataSource.setOptions({
        synchronize: false,
        migrationsRun: false,
        dropSchema: false,
        logging: false,
      })
      await dataSource.initialize()

      // get generated SQL diffs
      const sqlInMemory = await dataSource.driver
        .createSchemaBuilder()
        .log()
      await dataSource.destroy()

      // optional pretty formatting
      if (args.pretty) {
        sqlInMemory.upQueries.forEach(q => {
          q.query = MigrationGenerateCommand.prettifyQuery(q.query)
        })
        sqlInMemory.downQueries.forEach(q => {
          q.query = MigrationGenerateCommand.prettifyQuery(q.query)
        })
      }

      // transform DROP+ADD into ALTER COLUMN for type-only changes
      const transformedUp: string[] = []
      const upList = sqlInMemory.upQueries.map(q => q.query)
      for (let i = 0; i < upList.length; i++) {
        const cur = upList[i]
        const next = upList[i + 1]
        const dropMatch = cur.match(/^ALTER TABLE "(.+)" DROP COLUMN "(.+)"$/)
        const addMatch = next?.match(/^ALTER TABLE "(.+)" ADD "(.+)" (.+)$/)
        if (
          dropMatch &&
          addMatch &&
          dropMatch[1] === addMatch[1] &&
          dropMatch[2] === addMatch[2]
        ) {
          // only type or default changed → ALTER COLUMN instead
          transformedUp.push(
            `ALTER TABLE "${dropMatch[1]}" ALTER COLUMN "${dropMatch[2]}" TYPE ${addMatch[3]}`
          )
          i++ // skip the ADD
        } else {
          transformedUp.push(cur)
        }
      }

      // build migration method bodies
      const upSqls = transformedUp.map(q =>
        `        await queryRunner.query(\`${q.replace(/`/g, "\\`")}\`);`
      )
      const downSqls = sqlInMemory.downQueries.map(q =>
        `        await queryRunner.query(\`${q.query.replace(/`/g, "\\`")}\`);`
      )

      if (!upSqls.length) {
        if (args.check) {
          console.log(ansi.green`No changes in database schema were found`)
          process.exit(0)
        }
        console.log(
          ansi.yellow`No changes found - use "typeorm migration:create" for an empty migration.`,
        )
        process.exit(1)
      }

      // generate file content
      const fileContent = args.outputJs
        ? MigrationGenerateCommand.getJavascriptTemplate(
            path.basename(fullPath),
            timestamp,
            upSqls,
            downSqls.reverse(),
            args.esm,
          )
        : MigrationGenerateCommand.getTemplate(
            path.basename(fullPath),
            timestamp,
            upSqls,
            downSqls.reverse(),
          )

      if (args.dryrun) {
        console.log(
          ansi.green(
            `Migration ${ansi.blue(fullPath + extension)} content:\n\n${ansi.white(
              fileContent,
            )}`,
          ),
        )
      } else {
        const migrationFileName = `${path.dirname(fullPath)}/${filename}`
        await CommandUtils.createFile(migrationFileName, fileContent)
        console.log(
          ansi.green`Migration ${ansi.blue(migrationFileName)} generated successfully.`,
        )
        process.exit(0)
      }
    } catch (err) {
      PlatformTools.logCmdErr("Error during migration generation:", err)
      process.exit(1)
    }
  }

  protected static queryParams(parameters: any[] | undefined): string {
    if (!parameters || !parameters.length) return ""
    return `, ${JSON.stringify(parameters)}`
  }

  protected static getTemplate(
    name: string,
    timestamp: number,
    upSqls: string[],
    downSqls: string[],
  ): string {
    const migrationName = `${camelCase(name, true)}${timestamp}`
    return `import { MigrationInterface, QueryRunner } from "typeorm";

export class ${migrationName} implements MigrationInterface {
  name = '${migrationName}'

  public async up(queryRunner: QueryRunner): Promise<void> {
${upSqls.join("\n")}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
${downSqls.join("\n")}
  }
}
`
  }

  protected static getJavascriptTemplate(
    name: string,
    timestamp: number,
    upSqls: string[],
    downSqls: string[],
    esm: boolean,
  ): string {
    const migrationName = `${camelCase(name, true)}${timestamp}`
    const exportMethod = esm ? "export" : "module.exports ="
    return `/**
 * @typedef {import("typeorm").MigrationInterface} MigrationInterface
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
${exportMethod} class ${migrationName} {
  name = '${migrationName}'

  async up(queryRunner) {
${upSqls.join("\n")}
  }

  async down(queryRunner) {
${downSqls.join("\n")}
  }
}
`
  }

  protected static prettifyQuery(query: string) {
    const formatted = format(query, { indent: "    " })
    return "\n" + formatted.replace(/^/gm, "            ") + "\n        "
  }
}
