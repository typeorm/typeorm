import { format } from "@sqltools/formatter/lib/sqlFormatter"
import ansi from "ansis"
import * as path from "path"
import process from "process"
import yargs from "yargs"
import { DataSource } from "../data-source"
import { PlatformTools } from "../platform/PlatformTools"
import { camelCase } from "../util/StringUtils"
import { CommandUtils } from "./CommandUtils"

/**
 * Generates a new migration file with sql needs to be executed to update schema.
 */
export class MigrationGenerateCommand implements yargs.CommandModule {
    command = "migration:generate <path>"
    describe =
        "Generates a new migration file with sql needs to be executed to update schema."

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
                describe:
                    "Path to the file where your DataSource instance is defined.",
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
                    "Generate a migration file on Javascript instead of Typescript",
            })
            .option("dr", {
                alias: "dryrun",
                type: "boolean",
                default: false,
                describe:
                    "Prints out the contents of the migration instead of writing it to a file",
            })
            .option("ch", {
                alias: "check",
                type: "boolean",
                default: false,
                describe:
                    "Verifies that the current database is up to date and that no migrations are needed. Otherwise exits with code 1.",
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
        const filename = timestamp + "-" + path.basename(fullPath) + extension

        let dataSource: DataSource | undefined = undefined
        try {
            dataSource = await CommandUtils.loadDataSource(
                path.resolve(process.cwd(), args.dataSource as string),
            )
            dataSource.setOptions({
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: false,
            })
            await dataSource.initialize()

            const upSqls: string[] = [],
                downSqls: string[] = []

            try {
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                if (args.pretty) {
                    sqlInMemory.upQueries.forEach((upQuery) => {
                        upQuery.query = MigrationGenerateCommand.prettifyQuery(
                            upQuery.query,
                        )
                    })
                    sqlInMemory.downQueries.forEach((downQuery) => {
                        downQuery.query =
                            MigrationGenerateCommand.prettifyQuery(
                                downQuery.query,
                            )
                    })
                }

                sqlInMemory.upQueries.forEach((upQuery) => {
                    upSqls.push(
                        "        await queryRunner.query(`" +
                            upQuery.query.replace(new RegExp("`", "g"), "\\`") +
                            "`" +
                            MigrationGenerateCommand.queryParams(
                                upQuery.parameters,
                            ) +
                            ");",
                    )
                })
                sqlInMemory.downQueries.forEach((downQuery) => {
                    downSqls.push(
                        "        await queryRunner.query(`" +
                            downQuery.query.replace(
                                new RegExp("`", "g"),
                                "\\`",
                            ) +
                            "`" +
                            MigrationGenerateCommand.queryParams(
                                downQuery.parameters,
                            ) +
                            ");",
                    )
                })
            } finally {
                await dataSource.destroy()
            }

            if (!upSqls.length) {
                if (args.check) {
                    console.log(
                        ansi.green(`No changes in database schema were found`),
                    )
                    process.exit(0)
                } else {
                    console.log(
                        ansi.yellow(
                            `No changes in database schema were found - cannot generate a migration. To create a new empty migration use "typeorm migration:create" command`,
                        ),
                    )
                    process.exit(1)
                }
            } else if (!args.path) {
                console.log(ansi.yellow("Please specify a migration path"))
                process.exit(1)
            }

            const fileContent = args.outputJs
                ? MigrationGenerateCommand.getJavascriptTemplate(
                      path.basename(fullPath),
                      timestamp,
                      upSqls,
                      downSqls.reverse(),
                  )
                : MigrationGenerateCommand.getTemplate(
                      path.basename(fullPath),
                      timestamp,
                      upSqls,
                      downSqls.reverse(),
                  )

            if (args.check) {
                console.log(
                    ansi.yellow(
                        `Unexpected changes in database schema were found in check mode:\n\n${ansi.white(
                            fileContent,
                        )}`,
                    ),
                )
                process.exit(1)
            }

            if (args.dryrun) {
                console.log(
                    ansi.green(
                        `Migration ${ansi.blue(
                            fullPath + extension,
                        )} has content:\n\n${ansi.white(fileContent)}`,
                    ),
                )
            } else {
                const migrationFileName =
                    path.dirname(fullPath) + "/" + filename
                await CommandUtils.createFile(migrationFileName, fileContent)

                console.log(
                    ansi.green(
                        `Migration ${ansi.blue(
                            migrationFileName,
                        )} has been generated successfully.`,
                    ),
                )
                if (args.exitProcess !== false) {
                    process.exit(0)
                }
            }
        } catch (err) {
            PlatformTools.logCmdErr("Error during migration generation:", err)
            process.exit(1)
        }
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Formats query parameters for migration queries if parameters actually exist
     */
    protected static queryParams(parameters: any[] | undefined): string {
        if (!parameters || !parameters.length) {
            return ""
        }

        return `, ${JSON.stringify(parameters)}`
    }

    /**
     * Gets contents of the migration file.
     */
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
${upSqls.join(`
`)}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
${downSqls.join(`
`)}
    }

}
`
    }

    /**
     * Gets contents of the migration file in Javascript.
     */
    protected static getJavascriptTemplate(
        name: string,
        timestamp: number,
        upSqls: string[],
        downSqls: string[],
    ): string {
        const migrationName = `${camelCase(name, true)}${timestamp}`

        return `const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class ${migrationName} {
    name = '${migrationName}'

    async up(queryRunner) {
${upSqls.join(`
`)}
    }

    async down(queryRunner) {
${downSqls.join(`
`)}
    }
}
`
    }

    /**
     *
     */
    protected static prettifyQuery(query: string) {
        const formattedQuery = format(query, { indent: "    " })
        return (
            "\n" + formattedQuery.replace(/^/gm, "            ") + "\n        "
        )
    }
}
