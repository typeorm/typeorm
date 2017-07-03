import {createConnection} from "../index";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";

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
            .option("cf", {
                alias: "config",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(argv: any) {

        try {
            process.env.SKIP_SCHEMA_CREATION = true; // todo: maybe simply re-assign connection options?
            process.env.SKIP_SUBSCRIBERS_LOADING = true; // todo: maybe simply re-assign connection options?
            const connectionOptionsReader = new ConnectionOptionsReader({ root: process.cwd(), configName: argv.config });
            const connectionOptions = await connectionOptionsReader.get(argv.connection);
            const connection = await createConnection(connectionOptions);

            try {
                await connection.undoLastMigration();

            } catch (err) {
                console.error(err);

            } finally {
                await connection.close();
            }

        } catch (err) {
            console.error(err);
            // throw err;
        } finally {
            process.exit(0);
        }
    }

}
