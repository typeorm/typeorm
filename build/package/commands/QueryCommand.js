"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryCommand = void 0;
var tslib_1 = require("tslib");
var index_1 = require("../index");
var ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
var PlatformTools_1 = require("../platform/PlatformTools");
var chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Executes an sql query on the given connection.
 */
var QueryCommand = /** @class */ (function () {
    function QueryCommand() {
        this.command = "query [query]";
        this.describe = "Executes given SQL query on a default connection. Specify connection name to run query on a specific connection.";
    }
    QueryCommand.prototype.builder = function (args) {
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
    };
    QueryCommand.prototype.handler = function (args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var connection, queryRunner, connectionOptionsReader, connectionOptions, query, queryResult, err_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        connection = undefined;
                        queryRunner = undefined;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 12]);
                        connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({
                            root: process.cwd(),
                            configName: args.config
                        });
                        return [4 /*yield*/, connectionOptionsReader.get(args.connection)];
                    case 2:
                        connectionOptions = _a.sent();
                        Object.assign(connectionOptions, {
                            synchronize: false,
                            migrationsRun: false,
                            dropSchema: false,
                            logging: false
                        });
                        return [4 /*yield*/, index_1.createConnection(connectionOptions)];
                    case 3:
                        connection = _a.sent();
                        // create a query runner and execute query using it
                        queryRunner = connection.createQueryRunner();
                        query = args.query;
                        console.log(chalk_1.default.green("Running query: ") + PlatformTools_1.PlatformTools.highlightSql(query));
                        return [4 /*yield*/, queryRunner.query(query)];
                    case 4:
                        queryResult = _a.sent();
                        if (typeof queryResult === "undefined") {
                            console.log(chalk_1.default.green("Query has been executed. No result was returned."));
                        }
                        else {
                            console.log(chalk_1.default.green("Query has been executed. Result: "));
                            console.log(PlatformTools_1.PlatformTools.highlightJson(JSON.stringify(queryResult, undefined, 2)));
                        }
                        return [4 /*yield*/, queryRunner.release()];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, connection.close()];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 12];
                    case 7:
                        err_1 = _a.sent();
                        if (!queryRunner) return [3 /*break*/, 9];
                        return [4 /*yield*/, queryRunner.release()];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9:
                        if (!connection) return [3 /*break*/, 11];
                        return [4 /*yield*/, connection.close()];
                    case 10:
                        _a.sent();
                        _a.label = 11;
                    case 11:
                        console.log(chalk_1.default.black.bgRed("Error during query execution:"));
                        console.error(err_1);
                        process.exit(1);
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    return QueryCommand;
}());
exports.QueryCommand = QueryCommand;

//# sourceMappingURL=QueryCommand.js.map
