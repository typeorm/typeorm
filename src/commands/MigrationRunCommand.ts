import {createConnection} from "../index";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {Connection} from "../connection/Connection";
const chalk = require("chalk");

/**
 * Runs migration command.
 */
export class MigrationRunCommand {

    command = "migrations:run";
    describe = "Runs all pending migrations.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which run a query."
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
                subscribers: [],
                dropSchemaOnConnection: false,
                autoSchemaSync: false,
                autoMigrationsRun: false,
                logging: { logQueries: false, logFailedQueryError: false, logSchemaCreation: true }
            });
            connection = await createConnection(connectionOptions);

            await connection.runMigrations();
            // console.log(chalk.green("Migrations were successfully executed.")); // todo: make log inside "runMigrations" method

        } catch (err) {
            console.log(chalk.black.bgRed("Error during migration run:"));
            console.error(err);
            // throw err;

        } finally {
            if (connection)
                await connection.close();
        }
    }

}