import {createConnection} from "../index";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {Connection} from "../connection/Connection";
const chalk = require("chalk");

/**
 * Reverts last migration command.
 */
export class MigrationRevertCommand {

    command = "migration:revert";
    describe = "Reverts last executed migration.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which run a query."
            })
            .option("transaction", {
                alias: "t",
                default: "default",
                describe: "Indicates if transaction should be used or not for migration revert. Enabled by default."
            })
            .option("f", {
                alias: "config",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(argv: any) {

        let connection: Connection|undefined = undefined;
        try {
            const connectionOptionsReader = new ConnectionOptionsReader({ root: process.cwd(), configName: argv.config });
            const connectionOptions = await connectionOptionsReader.get(argv.connection);
            Object.assign(connectionOptions, {
                subscribers: [],
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: ["query", "error", "schema"]
            });
            connection = await createConnection(connectionOptions);

            const options = {
                transactionMode: "all" as "all" | "none" | "each",
            };

            switch (argv["t"]) {
                case "all":
                    options.transactionMode = "all";
                    break;
                case "none":
                case "false":
                    options.transactionMode = "none";
                    break;
                case "each":
                    options.transactionMode = "each";
                    break;
                default:
                    // noop
            }

            await connection.undoLastMigration(options);
            await connection.close();

        } catch (err) {
            if (connection) await (connection as Connection).close();

            console.log(chalk.black.bgRed("Error during migration revert:"));
            console.error(err);
            process.exit(1);
        }
    }

}