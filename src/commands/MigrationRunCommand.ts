import {createConnection} from "../index";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {Connection} from "../connection/Connection";
import * as process from "process";
import * as yargs from "yargs";
const chalk = require("chalk");

/**
 * Runs migration command.
 */
export class MigrationRunCommand implements yargs.CommandModule {

    command = "migration:run";
    describe = "Runs all pending migrations.";
    aliases = "migrations:run";

    builder(args: yargs.Argv) {
        return args
            .option("connection", {
                alias: "c",
                default: "default",
                describe: "Name of the connection on which run a query."
            })
            .option("transaction", {
                alias: "t",
                default: "default",
                describe: "Indicates if transaction should be used or not for migration run. Enabled by default."
            })
            .option("config", {
                alias: "f",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            })
            .option("force", {
                default: false,
                describe: "Force migration to execute, even when the hash check fails"
            });
    }

    async handler(args: yargs.Arguments) {
        if (args._[0] === "migrations:run") {
            console.log("'migrations:run' is deprecated, please use 'migration:run' instead");
        }

        let connection: Connection|undefined = undefined;
        try {
            const connectionOptionsReader = new ConnectionOptionsReader({ root: process.cwd(), configName: args.config });
            const connectionOptions = await connectionOptionsReader.get(args.connection);
            Object.assign(connectionOptions, {
                subscribers: [],
                synchronize: false,
                migrationsRun: false,
                migrationsIgnoreHash: args["force"] ? true : connectionOptions.migrationsIgnoreHash,
                dropSchema: false,
                logging: ["query", "error", "schema"]
            });
            connection = await createConnection(connectionOptions);

            const options = {
                transaction: args["t"] === "false" ? false : true
            };
            await connection.runMigrations(options);
            await connection.close();
            // exit process if no errors
            process.exit(0);

        } catch (err) {
            if (connection) await (connection as Connection).close();

            console.log(chalk.black.bgRed("Error during migration run:"));
            console.error(err);
            process.exit(1);
        }
    }

}
