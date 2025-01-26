import ansi from "ansis"
import path from "path"
import process from "process"
import yargs from "yargs"
import { DataSource } from "../data-source/DataSource"
import { PlatformTools } from "../platform/PlatformTools"
import { CommandUtils } from "./CommandUtils"

/**
 * Synchronizes database schema with entities.
 */
export class SchemaSyncCommand implements yargs.CommandModule {
    command = "schema:sync"
    describe =
        "Synchronizes your entities with database schema. It runs schema update queries on all connections you have. " +
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
                logging: ["query", "schema"],
            })
            await dataSource.initialize()
            await dataSource.synchronize()
            await dataSource.destroy()

            console.log(
                ansi.green("Schema synchronization finished successfully."),
            )
        } catch (err) {
            PlatformTools.logCmdErr("Error during schema synchronization:", err)

            if (dataSource && dataSource.isInitialized)
                await dataSource.destroy()

            process.exit(1)
        }
    }
}
