import { DataSource } from "../data-source/DataSource"
import * as yargs from "yargs"
import chalk from "chalk"
import { PlatformTools } from "../platform/PlatformTools"
import path from "path"
import process from "process"
import { CommandUtils } from "./CommandUtils"

/**
 * Synchronizes database schema with entities.
 */
export class SchemaSyncCommand implements yargs.CommandModule {
    // Defines the command name and description.
    command = "schema:sync"
    describe =
        "Synchronizes your entities with database schema. It runs schema update queries on all connections you have. " +
        "To run update queries on a concrete connection use -c option."

    builder(args: yargs.Argv) {
        // Defines an option to specify the path to the file where the DataSource instance is defined.
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
            // Loads the DataSource instance from the specified file.
            dataSource = await CommandUtils.loadDataSource(
                path.resolve(process.cwd(), args.dataSource as string),
            )
            dataSource.setOptions({
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: ["query", "schema"],
            })
            // Initializes the DataSource and synchronizes the schema with entities.
            await dataSource.initialize()
            await dataSource.synchronize()
            await dataSource.destroy()

            console.log(
                chalk.green("Schema synchronization finished successfully."),
            )
        } catch (err) {
            // Logs the error and exits with a non-zero code.
            PlatformTools.logCmdErr("Error during schema synchronization:", err)

            if (dataSource && dataSource.isInitialized)
                await dataSource.destroy()

            process.exit(1)
        }
    }
}
