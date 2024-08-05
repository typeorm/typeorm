import { DataSource } from "../data-source/DataSource"
import * as yargs from "yargs"
import chalk from "chalk"
import { PlatformTools } from "../platform/PlatformTools"
import path from "path"
import process from "process"
import { CommandUtils } from "./CommandUtils"
import { DefaultCliArgumentsBuilder } from "./common/default-cli-arguments-builder"

/**
 * Drops all tables of the database from the given dataSource.
 */
export class SchemaDropCommand implements yargs.CommandModule {
    command = "schema:drop"
    describe =
        "Drops all tables in the database on your default dataSource. " +
        "To drop table of a concrete connection's database use -c option."

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
                logging: ["query", "schema"],
            })
            await dataSource.initialize()
            await dataSource.dropDatabase()
            await dataSource.destroy()

            console.log(
                chalk.green("Database schema has been successfully dropped."),
            )
        } catch (err) {
            PlatformTools.logCmdErr("Error during schema drop:", err)

            if (dataSource && dataSource.isInitialized)
                await dataSource.destroy()

            process.exit(1)
        }
    }
}
