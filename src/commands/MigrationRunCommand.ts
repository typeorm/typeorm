import path from "path"
import process from "process"
import * as yargs from "yargs"
import { PlatformTools } from "../platform/PlatformTools"
import { DataSource } from "../data-source"
import { CommandUtils } from "./CommandUtils"

/**
 * Runs migration command.
 */
export class MigrationRunCommand implements yargs.CommandModule {
    command = "migration:run"
    describe = "Runs all pending migrations."

    builder(args: yargs.Argv) {
        return args
            .option("dataSource", {
                alias: "d",
                describe:
                    "Path to the file where your DataSource instance is defined.",
                demandOption: true,
            })
            .option("transaction", {
                alias: "t",
                default: "default",
                describe:
                    "Indicates if transaction should be used or not for migration run. Enabled by default.",
            })
            .option("fake", {
                alias: "f",
                type: "boolean",
                default: false,
                describe:
                    "Fakes running the migrations if table schema has already been changed manually or externally " +
                    "(e.g. through another project)",
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
