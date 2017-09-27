import {createConnection} from "../index";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {Connection} from "../connection/Connection";
const chalk = require("chalk");

/**
 * Reverts last migration command.
 */
export class MigrationRevertCommand {

    command = "migrations:revert";
    describe = "Reverts last executed migration.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which run a query."
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
                logging: ["schema"]
            });
            connection = await createConnection(connectionOptions);
            await connection.undoLastMigration();
            await connection.close();

        } catch (err) {
            if (connection) await (connection as Connection).close();

            console.log(chalk.black.bgRed("Error during migration revert:"));
            console.error(err);
            process.exit(1);
        }
    }

}