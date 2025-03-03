import { DataSource } from "../data-source/DataSource"
import * as yargs from "yargs"
import { PlatformTools } from "../platform/PlatformTools"
import path from "path"
import process from "process"
import { CommandUtils } from "./CommandUtils"

/**
 * Reverts last migration command.
 */
export class MigrationRevertCommand implements yargs.CommandModule {
    command = "migration:revert"
    describe = "Reverts last executed migration."

    builder(args: yargs.Argv) {
        return args
            .option("dataSource", {
                alias: "d",
                describe:
                    "Path to the file where your DataSource instance is defined.",
                demandOption: true,
            })
            .option("until", {
                alias: "u",
                default: undefined,
                describe:
                    "Revert all migrations run after migration with given name.",
            })
            .option("transaction", {
                alias: "t",
                default: "default",
                describe:
                    "Indicates if transaction should be used or not for migration revert. Enabled by default.",
            })
            .option("fake", {
                alias: "f",
                type: "boolean",
                default: false,
                describe: "Fakes reverting the migration",
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
                logging: ["query", "error", "schema"],
            })
            await dataSource.initialize()

            const options = {
                transaction:
                    dataSource.options.migrationsTransactionMode ??
                    ("all" as "all" | "none" | "each"),
                fake: !!args.f,
                until:
                    args?.until || args?.until == 0
                        ? String(args.until)
                        : undefined,
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

            await dataSource.revertMigration(options)
            await dataSource.destroy()
        } catch (err) {
            PlatformTools.logCmdErr("Error during migration revert:", err)

            if (dataSource && dataSource.isInitialized)
                await dataSource.destroy()

            process.exit(1)
        }
    }
}
