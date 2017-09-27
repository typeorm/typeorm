import {createConnection} from "../index";
import {Connection} from "../connection/Connection";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
const chalk = require("chalk");

/**
 * Synchronizes database schema with entities.
 */
export class SchemaSyncCommand {
    command = "schema:sync";
    describe = "Synchronizes your entities with database schema. It runs schema update queries on all connections you have. " +
        "To run update queries on a concrete connection use -c option.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which schema synchronization needs to to run."
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
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: ["query", "schema"]
            });
            connection = await createConnection(connectionOptions);
            await connection.synchronize(false);
            await connection.close();

            console.log(chalk.green("Schema syncronization finished successfully."));

        } catch (err) {
            if (connection) await (connection as Connection).close();

            console.log(chalk.black.bgRed("Error during schema synchronization:"));
            console.error(err);
            process.exit(1);
        }
    }
}