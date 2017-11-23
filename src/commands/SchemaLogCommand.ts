import {createConnection} from "../index";
import {Connection} from "../connection/Connection";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {highlight} from "cli-highlight";

const chalk = require("chalk");

/**
 * Shows sql to be executed by schema:sync command.
 */
export class SchemaLogCommand {

    command = "schema:log";
    describe = "Shows sql to be executed by schema:sync command. It shows sql log only for your default connection. " +
        "To run update queries on a concrete connection use -c option.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection of which schema sync log should be shown."
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
                logging: false
            });
            connection = await createConnection(connectionOptions);
            const sqlInMemory = await connection.driver.createSchemaBuilder().log();
            if (sqlInMemory.upQueries.length === 0) {
                console.log(chalk.yellow("Your schema is up to date - there are no queries to be executed by schema syncronization."));

            } else {
                const lengthSeparators = String(sqlInMemory.upQueries.length).split("").map(char => "-").join("");
                console.log(chalk.yellow("---------------------------------------------------------------" + lengthSeparators));
                console.log(chalk.yellow.bold(`-- Schema syncronization will execute following sql queries (${chalk.white(sqlInMemory.upQueries.length)}):`));
                console.log(chalk.yellow("---------------------------------------------------------------" + lengthSeparators));

                sqlInMemory.upQueries.forEach(query => {
                    let sqlString = query;
                    sqlString = sqlString.trim();
                    sqlString = sqlString.substr(-1) === ";" ? sqlString : sqlString + ";";
                    console.log(highlight(sqlString));
                });
            }
            await connection.close();

        } catch (err) {
            if (connection)

            console.log(chalk.black.bgRed("Error during schema synchronization:"));
            console.error(err);
            process.exit(1);
        }
    }
}