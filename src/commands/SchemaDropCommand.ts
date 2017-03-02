import {createConnections, createConnection} from "../index";
import {Connection} from "../connection/Connection";

/**
 * Drops all tables of the database from the given connection.
 */
export class SchemaDropCommand {
    command = "schema:drop";
    describe = "Drops all tables in the database. It drops tables on all connections you have. " +
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
                default: "ormconfig.json",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(argv: any) {

        let connection: Connection|undefined = undefined, connections: Connection[] = [];
        try {
            process.env.LOGGER_CLI_SCHEMA_SYNC = true;
            process.env.SKIP_SCHEMA_CREATION = true;
            if (argv.connection) {
                connection = await createConnection(argv.connection, process.cwd() + "/" + argv.config);
                await connection.dropDatabase();

            } else {
                connections = await createConnections();
                await Promise.all(connections.map(connection => connection.dropDatabase()));
            }

        } catch (err) {
            if (connection)
                (connection as Connection).logger.log("error", err);
            throw err;

        } finally {
            if (connection)
                await connection.close();

            await Promise.all(connections.map(connection => connection.close()));
        }
    }
}