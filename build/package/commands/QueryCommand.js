"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryCommand = void 0;
const tslib_1 = require("tslib");
const index_1 = require("../index");
const ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
const PlatformTools_1 = require("../platform/PlatformTools");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Executes an sql query on the given connection.
 */
class QueryCommand {
    constructor() {
        this.command = "query [query]";
        this.describe = "Executes given SQL query on a default connection. Specify connection name to run query on a specific connection.";
    }
    builder(args) {
        return args
            .positional("query", {
            describe: "The SQL Query to run",
            type: "string"
        })
            .option("c", {
            alias: "connection",
            default: "default",
            describe: "Name of the connection on which to run a query."
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
            let queryRunner = undefined;
            try {
                // create a connection
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
                // create a query runner and execute query using it
                queryRunner = connection.createQueryRunner();
                const query = args.query;
                console.log(chalk_1.default.green("Running query: ") + PlatformTools_1.PlatformTools.highlightSql(query));
                const queryResult = yield queryRunner.query(query);
                if (typeof queryResult === "undefined") {
                    console.log(chalk_1.default.green("Query has been executed. No result was returned."));
                }
                else {
                    console.log(chalk_1.default.green("Query has been executed. Result: "));
                    console.log(PlatformTools_1.PlatformTools.highlightJson(JSON.stringify(queryResult, undefined, 2)));
                }
                yield queryRunner.release();
                yield connection.close();
            }
            catch (err) {
                if (queryRunner)
                    yield queryRunner.release();
                if (connection)
                    yield connection.close();
                console.log(chalk_1.default.black.bgRed("Error during query execution:"));
                console.error(err);
                process.exit(1);
            }
        });
    }
}
exports.QueryCommand = QueryCommand;

//# sourceMappingURL=QueryCommand.js.map
