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
    command = "cache:clear"
    describe = "Clears all data stored in query runner cache."

    builder(args: yargs.Argv) {
        return args.option("dataSource", {
            alias: "d",
            describe:
                "Path to the file where your DataSource instance is defined.",
            demandOption: true,
            default: process.env.TYPEORM_DATASOURCE,
        })
    }

    async handler(args: yargs.Arguments) {
        let dataSource: DataSource | undefined = undefined
        try {
            dataSource = await CommandUtils.loadDataSource(
                path.resolve(process.cwd(), args.dataSource as string),
            )
            dataSource.setOptions({
                subscribers: [],
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: ["schema"],
            })
            await dataSource.initialize()

            if (!dataSource.queryResultCache) {
                PlatformTools.logCmdErr(
                    "Cache is not enabled. To use cache enable it in connection configuration.",
                )
                return
            }

            await dataSource.queryResultCache.clear()
            console.log(chalk.green("Cache was successfully cleared"))

            await dataSource.destroy()
        } catch (err) {
            PlatformTools.logCmdErr("Error during cache clear.", err)

            if (dataSource && dataSource.isInitialized)
                await (dataSource as DataSource).destroy()

            process.exit(1)
        }
    }
}
