import {createConnection} from "../index";
import {Connection} from "../connection/Connection";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {highlight} from "cli-highlight";
import * as yargs from "yargs";
import chalk from "chalk";

/**
 * Shows sql to be executed by schema:sync command.
 */
export class SchemaLogCommand implements yargs.CommandModule {

    command = "schema:log";
    describe = "Shows sql to be executed by schema:sync command. It shows sql log only for your default connection. " +
        "To run update queries on a concrete connection use -c option.";

    builder(args: yargs.Argv) {
        return args
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

    async handler(args: yargs.Arguments) {

        let connection: Connection|undefined = undefined;
        try {

            const connectionOptionsReader = new ConnectionOptionsReader({
                root: process.cwd(),
                configName: args.config as any
            });
            const connectionOptions = await connectionOptionsReader.get(args.connection as any);
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
                console.log(chalk.yellow.bold(`-- Schema syncronization will execute following sql queries (${chalk.white(sqlInMemory.upQueries.length.toString())}):`));
                console.log(chalk.yellow("---------------------------------------------------------------" + lengthSeparators));

                sqlInMemory.upQueries.forEach(upQuery => {
                    let sqlString = upQuery.query;
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
