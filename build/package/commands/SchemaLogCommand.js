"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaLogCommand = void 0;
var tslib_1 = require("tslib");
var index_1 = require("../index");
var ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
var cli_highlight_1 = require("cli-highlight");
var chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Shows sql to be executed by schema:sync command.
 */
var SchemaLogCommand = /** @class */ (function () {
    function SchemaLogCommand() {
        this.command = "schema:log";
        this.describe = "Shows sql to be executed by schema:sync command. It shows sql log only for your default connection. " +
            "To run update queries on a concrete connection use -c option.";
    }
    SchemaLogCommand.prototype.builder = function (args) {
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
    };
    SchemaLogCommand.prototype.handler = function (args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var connection, connectionOptionsReader, connectionOptions, sqlInMemory, lengthSeparators, err_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        connection = undefined;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
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
                        return [4 /*yield*/, connection.driver.createSchemaBuilder().log()];
                    case 4:
                        sqlInMemory = _a.sent();
                        if (sqlInMemory.upQueries.length === 0) {
                            console.log(chalk_1.default.yellow("Your schema is up to date - there are no queries to be executed by schema syncronization."));
                        }
                        else {
                            lengthSeparators = String(sqlInMemory.upQueries.length).split("").map(function (char) { return "-"; }).join("");
                            console.log(chalk_1.default.yellow("---------------------------------------------------------------" + lengthSeparators));
                            console.log(chalk_1.default.yellow.bold("-- Schema syncronization will execute following sql queries (" + chalk_1.default.white(sqlInMemory.upQueries.length.toString()) + "):"));
                            console.log(chalk_1.default.yellow("---------------------------------------------------------------" + lengthSeparators));
                            sqlInMemory.upQueries.forEach(function (upQuery) {
                                var sqlString = upQuery.query;
                                sqlString = sqlString.trim();
                                sqlString = sqlString.substr(-1) === ";" ? sqlString : sqlString + ";";
                                console.log(cli_highlight_1.highlight(sqlString));
                            });
                        }
                        return [4 /*yield*/, connection.close()];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        err_1 = _a.sent();
                        if (connection)
                            console.log(chalk_1.default.black.bgRed("Error during schema synchronization:"));
                        console.error(err_1);
                        process.exit(1);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return SchemaLogCommand;
}());
exports.SchemaLogCommand = SchemaLogCommand;

//# sourceMappingURL=SchemaLogCommand.js.map
