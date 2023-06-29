"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaLogCommand = void 0;
const tslib_1 = require("tslib");
const index_1 = require("../index");
const ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
const cli_highlight_1 = require("cli-highlight");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Shows sql to be executed by schema:sync command.
 */
class SchemaLogCommand {
    constructor() {
        this.command = "schema:log";
        this.describe = "Shows sql to be executed by schema:sync command. It shows sql log only for your default connection. " +
            "To run update queries on a concrete connection use -c option.";
    }
    builder(args) {
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
    handler(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let connection = undefined;
            try {
                const connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({
                    root: process.cwd(),
                    configName: args.config
                });
                const connectionOptions = yield connectionOptionsReader.get(args.connection);
                Object.assign(connectionOptions, {
                    synchronize: false,
                    migrationsRun: false,
                    dropSchema: false,
                    logging: false
                });
                connection = yield (0, index_1.createConnection)(connectionOptions);
                const sqlInMemory = yield connection.driver.createSchemaBuilder().log();
                if (sqlInMemory.upQueries.length === 0) {
                    console.log(chalk_1.default.yellow("Your schema is up to date - there are no queries to be executed by schema syncronization."));
                }
                else {
                    const lengthSeparators = String(sqlInMemory.upQueries.length).split("").map(char => "-").join("");
                    console.log(chalk_1.default.yellow("---------------------------------------------------------------" + lengthSeparators));
                    console.log(chalk_1.default.yellow.bold(`-- Schema syncronization will execute following sql queries (${chalk_1.default.white(sqlInMemory.upQueries.length.toString())}):`));
                    console.log(chalk_1.default.yellow("---------------------------------------------------------------" + lengthSeparators));
                    sqlInMemory.upQueries.forEach(upQuery => {
                        let sqlString = upQuery.query;
                        sqlString = sqlString.trim();
                        sqlString = sqlString.substr(-1) === ";" ? sqlString : sqlString + ";";
                        console.log((0, cli_highlight_1.highlight)(sqlString));
                    });
                }
                yield connection.close();
            }
            catch (err) {
                if (connection)
                    console.log(chalk_1.default.black.bgRed("Error during schema synchronization:"));
                console.error(err);
                process.exit(1);
            }
        });
    }
}
exports.SchemaLogCommand = SchemaLogCommand;

//# sourceMappingURL=SchemaLogCommand.js.map
