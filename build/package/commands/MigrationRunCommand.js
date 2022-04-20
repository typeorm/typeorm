"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationRunCommand = void 0;
var tslib_1 = require("tslib");
var index_1 = require("../index");
var ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
var process = tslib_1.__importStar(require("process"));
var chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Runs migration command.
 */
var MigrationRunCommand = /** @class */ (function () {
    function MigrationRunCommand() {
        this.command = "migration:run";
        this.describe = "Runs all pending migrations.";
        this.aliases = "migrations:run";
    }
    MigrationRunCommand.prototype.builder = function (args) {
        return args
            .option("connection", {
            alias: "c",
            default: "default",
            describe: "Name of the connection on which run a query."
        })
            .option("transaction", {
            alias: "t",
            default: "default",
            describe: "Indicates if transaction should be used or not for migration run. Enabled by default."
        })
            .option("config", {
            alias: "f",
            default: "ormconfig",
            describe: "Name of the file with connection configuration."
        });
    };
    MigrationRunCommand.prototype.handler = function (args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var connection, connectionOptionsReader, connectionOptions, options, err_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (args._[0] === "migrations:run") {
                            console.log("'migrations:run' is deprecated, please use 'migration:run' instead");
                        }
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
                            subscribers: [],
                            synchronize: false,
                            migrationsRun: false,
                            dropSchema: false,
                            logging: ["query", "error", "schema"]
                        });
                        return [4 /*yield*/, index_1.createConnection(connectionOptions)];
                    case 3:
                        connection = _a.sent();
                        options = {
                            transaction: "all",
                        };
                        switch (args.t) {
                            case "all":
                                options.transaction = "all";
                                break;
                            case "none":
                            case "false":
                                options.transaction = "none";
                                break;
                            case "each":
                                options.transaction = "each";
                                break;
                            default:
                            // noop
                        }
                        return [4 /*yield*/, connection.runMigrations(options)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, connection.close()];
                    case 5:
                        _a.sent();
                        // exit process if no errors
                        process.exit(0);
                        return [3 /*break*/, 9];
                    case 6:
                        err_1 = _a.sent();
                        if (!connection) return [3 /*break*/, 8];
                        return [4 /*yield*/, connection.close()];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        console.log(chalk_1.default.black.bgRed("Error during migration run:"));
                        console.error(err_1);
                        process.exit(1);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return MigrationRunCommand;
}());
exports.MigrationRunCommand = MigrationRunCommand;

//# sourceMappingURL=MigrationRunCommand.js.map
