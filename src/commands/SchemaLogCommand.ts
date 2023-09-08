import { DataSource } from "../data-source/DataSource"
import * as yargs from "yargs"
import chalk from "chalk"
import { PlatformTools } from "../platform/PlatformTools"
import path from "path"
import process from "process"
import { CommandUtils } from "./CommandUtils"

/**
 * Shows sql to be executed by schema:sync command.
 */
export class SchemaLogCommand implements yargs.CommandModule {
    command = "schema:log"
    describe =
        "Shows sql to be executed by schema:sync command. It shows sql log only for your default dataSource. " +
        "To run update queries on a concrete connection use -c option."

    builder(args: yargs.Argv) {
        return args.option("dataSource", {
            alias: "d",
            describe:
                "Path to the file where your DataSource instance is defined.",
            demandOption: true,
        })
    }

    async handler(args: yargs.Arguments) {
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

            const sqlInMemory = await dataSource.driver
                .createSchemaBuilder()
                .log()

            if (sqlInMemory.upQueries.length === 0) {
                console.log(
                    chalk.yellow(
                        "Your schema is up to date - there are no queries to be executed by schema synchronization.",
                    ),
                )
            } else {
                const lengthSeparators = String(sqlInMemory.upQueries.length)
                    .split("")
                    .map((char) => "-")
                    .join("")
                console.log(
                    chalk.yellow(
                        "---------------------------------------------------------------" +
                            lengthSeparators,
                    ),
                )
                console.log(
                    chalk.yellow.bold(
                        `-- Schema synchronization will execute following sql queries (${chalk.white(
                            sqlInMemory.upQueries.length.toString(),
                        )}):`,
                    ),
                )
                console.log(
                    chalk.yellow(
                        "---------------------------------------------------------------" +
                            lengthSeparators,
                    ),
                )

                sqlInMemory.upQueries.forEach((upQuery) => {
                    let sqlString = upQuery.query
                    sqlString = sqlString.trim()
                    sqlString =
                        sqlString.substr(-1) === ";"
                            ? sqlString
                            : sqlString + ";"
                    console.log(sqlString)
                })
            }
            await dataSource.destroy()
        } catch (err) {
            if (dataSource)
                PlatformTools.logCmdErr(
                    "Error during schema synchronization:",
                    err,
                )
            process.exit(1)
        }
    }
}
