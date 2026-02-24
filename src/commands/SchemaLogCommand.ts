import ansi from "ansis"
import path from "path"
import process from "process"
import yargs from "yargs"
import { DataSource } from "../data-source/DataSource"
import { PlatformTools } from "../platform/PlatformTools"
import { CommandUtils } from "./CommandUtils"
import { DefaultCliArgumentsBuilder } from "./common/default-cli-arguments-builder"

/**
 * Shows sql to be executed by schema:sync command.
 */
export class SchemaLogCommand implements yargs.CommandModule {
    command = "schema:log"
    describe =
        "Shows sql to be executed by schema:sync command. It shows sql log only for your default dataSource. " +
        "To run update queries on a concrete connection use -c option."

    builder(args: yargs.Argv) {
        return new DefaultCliArgumentsBuilder(args)
            .addDataSourceOption()
            .builder()
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
                    ansi.yellow`Your schema is up to date - there are no queries to be executed by schema synchronization.`,
                )
            } else {
                const lineSeparator = "".padStart(
                    63 + String(sqlInMemory.upQueries.length).length,
                    "-",
                )
                console.log(ansi.yellow(lineSeparator))
                console.log(
                    ansi.yellow
                        .bold`-- Schema synchronization will execute following sql queries (${ansi.white(
                        sqlInMemory.upQueries.length.toString(),
                    )}):`,
                )
                console.log(ansi.yellow(lineSeparator))

                sqlInMemory.upQueries.forEach((upQuery) => {
                    let sqlString = upQuery.query
                    sqlString = sqlString.trim()
                    sqlString = sqlString.endsWith(";")
                        ? sqlString
                        : sqlString + ";"
                    console.log(PlatformTools.highlightSql(sqlString))
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
