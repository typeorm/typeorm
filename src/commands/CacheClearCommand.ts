import { DataSource } from "../data-source/DataSource"
import * as yargs from "yargs"
import chalk from "chalk"
import { PlatformTools } from "../platform/PlatformTools"
import path from "path"
import process from "process"
import { CommandUtils } from "./CommandUtils"

/**
 * Clear cache command.
 */
export class CacheClearCommand implements yargs.CommandModule {
    // Define the command name and usage description for this command
    command = "cache:clear"
    describe = "Clears all data stored in query runner cache."

    // Define the command line options that this command supports
    builder(args: yargs.Argv) {
        return args.option("dataSource", {
            alias: "d",
            describe:
                "Path to the file where your DataSource instance is defined.",
            demandOption: true,
        })
    }

    // Define the logic that runs when this command is executed
    async handler(args: yargs.Arguments) {
        let dataSource: DataSource | undefined = undefined
        try {
            // Load the DataSource instance from the specified file path
            dataSource = await CommandUtils.loadDataSource(
                path.resolve(process.cwd(), args.dataSource as string),
            )

            // Disable all options that may affect the cache
            dataSource.setOptions({
                subscribers: [],
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: ["schema"],
            })

            // Initialize the DataSource instance
            await dataSource.initialize()

            // Check if the cache is enabled
            if (!dataSource.queryResultCache) {
                // If not, log an error message and exit the command
                PlatformTools.logCmdErr(
                    "Cache is not enabled. To use cache enable it in connection configuration.",
                )
                return
            }

            // Clear the cache
            await dataSource.queryResultCache.clear()
            console.log(chalk.green("Cache was successfully cleared"))

            // Destroy the DataSource instance
            await dataSource.destroy()
        } catch (err) {
            // If an error occurred, log an error message and exit the command with code 1
            PlatformTools.logCmdErr("Error during cache clear.", err)

            if (dataSource && dataSource.isInitialized)
                await (dataSource as DataSource).destroy()

            process.exit(1)
        }
    }
}
