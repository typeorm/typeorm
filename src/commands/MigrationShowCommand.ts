import type { DataSource } from "../data-source"
import * as process from "process"
import type * as yargs from "yargs"
import { PlatformTools } from "../platform/PlatformTools"
import path from "path"
import { CommandUtils } from "./CommandUtils"

/**
 * Shows all migrations and whether they have been run or not.
 */
export class MigrationShowCommand implements yargs.CommandModule {
    command = "migration:show"
    describe = "Show all migrations and whether they have been run or not"

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
                subscribers: [],
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: ["schema"],
            })
            await dataSource.initialize()
            await dataSource.showMigrations()
            await dataSource.destroy()

            process.exit(0)
        } catch (err) {
            PlatformTools.logCmdErr("Error during migration show:", err)

            if (dataSource && dataSource.isInitialized)
                await dataSource.destroy()

            process.exit(1)
        }
    }
}
