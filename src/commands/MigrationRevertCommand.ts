import { DataSource } from "../data-source/DataSource"
import * as yargs from "yargs"
import { PlatformTools } from "../platform/PlatformTools"
import path from "path"
import process from "process"
import { CommandUtils } from "./CommandUtils"
import { DefaultCliArgumentsBuilder } from "./common/default-cli-arguments-builder"

/**
 * Reverts last migration command.
 */
export class MigrationRevertCommand implements yargs.CommandModule {
    command = "migration:revert"
    describe = "Reverts last executed migration."

    builder(args: yargs.Argv) {
        return new DefaultCliArgumentsBuilder(args)
            .addDataSourceOption()
            .addTransactionOption()
            .addFakeOption({
                // Optionally override the default description to be more specific.
                // describe: "Fakes reverting the migration",
            })
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

            await dataSource.undoLastMigration(options)
            await dataSource.destroy()
        } catch (err) {
            PlatformTools.logCmdErr("Error during migration revert:", err)

            if (dataSource && dataSource.isInitialized)
                await dataSource.destroy()

            process.exit(1)
        }
    }
}
