"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaSyncCommand = void 0;
var tslib_1 = require("tslib");
var index_1 = require("../index");
var ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
var chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Synchronizes database schema with entities.
 */
var SchemaSyncCommand = /** @class */ (function () {
    function SchemaSyncCommand() {
        this.command = "schema:sync";
        this.describe = "Synchronizes your entities with database schema. It runs schema update queries on all connections you have. " +
            "To run update queries on a concrete connection use -c option.";
    }
    SchemaSyncCommand.prototype.builder = function (args) {
        return args
            .option("c", {
            alias: "connection",
            default: "default",
            describe: "Name of the connection on which schema synchronization needs to to run."
        })
            .option("f", {
            alias: "config",
            default: "ormconfig",
            describe: "Name of the file with connection configuration."
        });
    };
    SchemaSyncCommand.prototype.handler = function (args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var connection, connectionOptionsReader, connectionOptions, err_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        connection = undefined;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 9]);
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
                            logging: ["query", "schema"]
                        });
                        return [4 /*yield*/, index_1.createConnection(connectionOptions)];
                    case 3:
                        connection = _a.sent();
                        return [4 /*yield*/, connection.synchronize()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.close()];
                    case 5:
                        _a.sent();
                        console.log(chalk_1.default.green("Schema syncronization finished successfully."));
                        return [3 /*break*/, 9];
                    case 6:
                        err_1 = _a.sent();
                        if (!connection) return [3 /*break*/, 8];
                        return [4 /*yield*/, connection.close()];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        console.log(chalk_1.default.black.bgRed("Error during schema synchronization:"));
                        console.error(err_1);
                        process.exit(1);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return SchemaSyncCommand;
}());
exports.SchemaSyncCommand = SchemaSyncCommand;

//# sourceMappingURL=SchemaSyncCommand.js.map
