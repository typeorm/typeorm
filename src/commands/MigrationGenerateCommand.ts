import { CommandUtils } from "./CommandUtils"
import * as yargs from "yargs"
import chalk from "chalk"
import { PlatformTools } from "../platform/PlatformTools"
import { DataSource } from "../data-source"
import * as path from "path"
import process from "process"

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

            let fileContent = ""
            let hasSqlToRun = false

            try {
                const ret = await dataSource.generateMigration({
                    pretty: args.pretty,
                    name: filename,
                    timestamp,
                    outputJs: args.outputJs,
                })

                fileContent = ret.fileContent
                hasSqlToRun = ret.hasSqlToRun
            } finally {
                await dataSource.destroy()
            }

            if (!hasSqlToRun) {
                if (args.check) {
                    console.log(
                        chalk.green(`No changes in database schema were found`),
                    )
                    process.exit(0)
                } else {
                    console.log(
                        chalk.yellow(
                            `No changes in database schema were found - cannot generate a migration. To create a new empty migration use "typeorm migration:create" command`,
                        ),
                    )
                    process.exit(1)
                }
            } else if (!args.path) {
                console.log(chalk.yellow("Please specify a migration path"))
                process.exit(1)
            }

            if (args.check) {
                console.log(
                    chalk.yellow(
                        `Unexpected changes in database schema were found in check mode:\n\n${chalk.white(
                            fileContent,
                        )}`,
                    ),
                )
                process.exit(1)
            }

            if (args.dryrun) {
                console.log(
                    chalk.green(
                        `Migration ${chalk.blue(
                            fullPath + extension,
                        )} has content:\n\n${chalk.white(fileContent)}`,
                    ),
                )
            } else {
                const migrationFileName =
                    path.dirname(fullPath) + "/" + filename
                await CommandUtils.createFile(migrationFileName, fileContent)

                console.log(
                    chalk.green(
                        `Migration ${chalk.blue(
                            migrationFileName,
                        )} has been generated successfully.`,
                    ),
                )
                process.exit(0)
            }
        } catch (err) {
            PlatformTools.logCmdErr("Error during migration generation:", err)
            process.exit(1)
        }
    }
}
