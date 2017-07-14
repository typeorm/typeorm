import {createConnection} from "../index";
import {QueryRunner} from "../query-runner/QueryRunner";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {Connection} from "../connection/Connection";
import {highlight} from "cli-highlight";
import {PlatformTools} from "../platform/PlatformTools";
const chalk = require("chalk");

/**
 * Executes an sql query on the given connection.
 */
export class QueryCommand {
    command = "query";
    describe = "Executes given SQL query on a default connection. Specify connection name to run query on a specific connection.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which to run a query."
            })
            .option("cf", {
                alias: "config",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(argv: any) {

        let connection: Connection|undefined = undefined;
        let queryRunner: QueryRunner|undefined = undefined;
        try {

            // create a connection
            const connectionOptionsReader = new ConnectionOptionsReader({ root: process.cwd(), configName: argv.config });
            const connectionOptions = await connectionOptionsReader.get(argv.connection);
            Object.assign(connectionOptions, {
                dropSchemaOnConnection: false,
                autoSchemaSync: false,
                autoMigrationsRun: false,
                logging: { logQueries: false, logFailedQueryError: false, logSchemaCreation: false }
            });
            connection = await createConnection(connectionOptions);

            // create a query runner and execute query using it
            queryRunner = await connection.createQueryRunner();
            console.log(chalk.green("Running query: ") + PlatformTools.highlightSql(argv._[1]));
            const queryResult = await queryRunner.query(argv._[1]);
            console.log(chalk.green("Query has been executed. Result: "));
            console.log(PlatformTools.highlightJson(JSON.stringify(queryResult, undefined, 2)));

        } catch (err) {
            console.log(chalk.black.bgRed("Error during query execution:"));
            console.error(err);
            // throw err;

        } finally {
            if (queryRunner)
                await queryRunner.release();

            if (connection)
                await connection.close();
        }
    }
}