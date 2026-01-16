import path from "path"
import process from "process"
import * as yargs from "yargs"
import { PlatformTools } from "../platform/PlatformTools"
import { DataSource } from "../data-source"
import { CommandUtils } from "./CommandUtils"
import { DefaultCliArgumentsBuilder } from "./common/default-cli-arguments-builder"

/**
 * Runs migration command.
 */
export class MigrationRunCommand implements yargs.CommandModule {
    command = "migration:run"
    describe = "Runs all pending migrations."

    builder(args: yargs.Argv) {
        return new DefaultCliArgumentsBuilder(args)
            .addDataSourceOption()
            .addTransactionOption()
            .addFakeOption()
            .builder()
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
                logging: ["query", "error", "schema"],
            })
            await dataSource.initialize()

            const options = {
                transaction:
                    dataSource.options.migrationsTransactionMode ??
                    ("all" as "all" | "none" | "each"),
                fake: !!args.f,
            }

            switch (args.t) {
                case "all":
                    options.transaction = "all"
                    break
                case "none":
                case "false":
                    options.transaction = "none"
                    break
                case "each":
                    options.transaction = "each"
                    break
                default:
                // noop
            }

            await dataSource.runMigrations(options)
            await dataSource.destroy()

            // exit process if no errors
            process.exit(0)
        } catch (err) {
            PlatformTools.logCmdErr("Error during migration run:", err)

            if (dataSource && dataSource.isInitialized)
                await dataSource.destroy()

            process.exit(1)
        }
    }
}
