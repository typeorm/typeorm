import ansi from "ansis"
import path from "path"
import process from "process"
import yargs from "yargs"
import { DataSource } from "../data-source/DataSource"
import { PlatformTools } from "../platform/PlatformTools"
import { CommandUtils } from "./CommandUtils"
import { DefaultCliArgumentsBuilder } from "./common/default-cli-arguments-builder"

/**
 * Synchronizes database schema with entities.
 */
export class SchemaSyncCommand implements yargs.CommandModule {
    command = "schema:sync"
    describe =
        "Synchronizes your entities with database schema. It runs schema update queries on all connections you have. " +
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
                logging: ["query", "schema"],
            })
            await dataSource.initialize()
            await dataSource.synchronize()
            await dataSource.destroy()

            console.log(
                ansi.green`Schema synchronization finished successfully.`,
            )
        } catch (err) {
            PlatformTools.logCmdErr("Error during schema synchronization:", err)

            if (dataSource && dataSource.isInitialized)
                await dataSource.destroy()

            process.exit(1)
        }
    }
}
