"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheClearCommand = void 0;
var tslib_1 = require("tslib");
var index_1 = require("../index");
var ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
var chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Clear cache command.
 */
var CacheClearCommand = /** @class */ (function () {
    function CacheClearCommand() {
        this.command = "cache:clear";
        this.describe = "Clears all data stored in query runner cache.";
    }
    CacheClearCommand.prototype.builder = function (args) {
        return args
            .option("connection", {
            alias: "c",
            default: "default",
            describe: "Name of the connection on which run a query."
        })
            .option("config", {
            alias: "f",
            default: "ormconfig",
            describe: "Name of the file with connection configuration."
        });
    };
    CacheClearCommand.prototype.handler = function (args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var connection, connectionOptionsReader, connectionOptions, err_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        connection = undefined;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 10]);
                        connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({
                            root: process.cwd(),
                            configName: args.config
                        });
                        return [4 /*yield*/, connectionOptionsReader.get(args.connection)];
                    case 2:
                        connectionOptions = _a.sent();
                        Object.assign(connectionOptions, {
                            subscribers: [],
                            synchronize: false,
                            migrationsRun: false,
                            dropSchema: false,
                            logging: ["schema"]
                        });
                        return [4 /*yield*/, index_1.createConnection(connectionOptions)];
                    case 3:
                        connection = _a.sent();
                        if (!connection.queryResultCache) {
                            console.log(chalk_1.default.black.bgRed("Cache is not enabled. To use cache enable it in connection configuration."));
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, connection.queryResultCache.clear()];
                    case 4:
                        _a.sent();
                        console.log(chalk_1.default.green("Cache was successfully cleared"));
                        if (!connection) return [3 /*break*/, 6];
                        return [4 /*yield*/, connection.close()];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [3 /*break*/, 10];
                    case 7:
                        err_1 = _a.sent();
                        if (!connection) return [3 /*break*/, 9];
                        return [4 /*yield*/, connection.close()];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9:
                        console.log(chalk_1.default.black.bgRed("Error during cache clear:"));
                        console.error(err_1);
                        process.exit(1);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    return CacheClearCommand;
}());
exports.CacheClearCommand = CacheClearCommand;

//# sourceMappingURL=CacheClearCommand.js.map
