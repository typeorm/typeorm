import {createConnection, createConnections} from "../index";
import {Connection} from "../connection/Connection";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
const chalk = require("chalk");

/**
 * Drops all tables of the database from the given connection.
 */
export class SchemaDropCommand {
    command = "schema:drop";
    describe = "Drops all tables in the database on your default connection. " +
        "To drop table of a concrete connection's database use -c option.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which to drop all tables."
            })
            .option("cf", {
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
                dropSchemaOnConnection: false,
                autoSchemaSync: false,
                autoMigrationsRun: false,
                logging: {
                    logQueries: true,
                    logFailedQueryError: true,
                    logSchemaCreation: true
                }
            });
            connection = await createConnection(connectionOptions);
            await connection.dropDatabase();
            console.log(chalk.green("Database schema has been successfully dropped."));

        } catch (err) {
            console.log(chalk.black.bgRed("Error during schema drop:"));
            console.error(err);
            // throw err;

        } finally {
            if (connection)
                await connection.close();
        }
    }
}