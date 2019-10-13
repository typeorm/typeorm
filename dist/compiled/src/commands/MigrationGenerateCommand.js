"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
var CommandUtils_1 = require("./CommandUtils");
var index_1 = require("../index");
var MysqlDriver_1 = require("../driver/mysql/MysqlDriver");
var StringUtils_1 = require("../util/StringUtils");
var AuroraDataApiDriver_1 = require("../driver/aurora-data-api/AuroraDataApiDriver");
var chalk = require("chalk");
/**
 * Generates a new migration file with sql needs to be executed to update schema.
 */
var MigrationGenerateCommand = /** @class */ (function () {
    function MigrationGenerateCommand() {
        this.command = "migration:generate";
        this.describe = "Generates a new migration file with sql needs to be executed to update schema.";
        this.aliases = "migrations:generate";
    }
    MigrationGenerateCommand.prototype.builder = function (args) {
        return args
            .option("c", {
            alias: "connection",
            default: "default",
            describe: "Name of the connection on which run a query."
        })
            .option("n", {
            alias: "name",
            describe: "Name of the migration class.",
            demand: true
        })
            .option("d", {
            alias: "dir",
            describe: "Directory where migration should be created."
        })
            .option("f", {
            alias: "config",
            default: "ormconfig",
            describe: "Name of the file with connection configuration."
        });
    };
    MigrationGenerateCommand.prototype.handler = function (args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var timestamp, filename, directory, connectionOptionsReader, connectionOptions, err_1, connection, connectionOptionsReader, connectionOptions, sqlInMemory, upSqls_1, downSqls_1, fileContent, path, err_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (args._[0] === "migrations:generate") {
                            console.log("'migrations:generate' is deprecated, please use 'migration:generate' instead");
                        }
                        timestamp = new Date().getTime();
                        filename = timestamp + "-" + args.name + ".ts";
                        directory = args.dir;
                        if (!!directory) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({
                            root: process.cwd(),
                            configName: args.config
                        });
                        return [4 /*yield*/, connectionOptionsReader.get(args.connection)];
                    case 2:
                        connectionOptions = _a.sent();
                        directory = connectionOptions.cli ? connectionOptions.cli.migrationsDir : undefined;
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        connection = undefined;
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 15, , 18]);
                        connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({
                            root: process.cwd(),
                            configName: args.config
                        });
                        return [4 /*yield*/, connectionOptionsReader.get(args.connection)];
                    case 6:
                        connectionOptions = _a.sent();
                        Object.assign(connectionOptions, {
                            synchronize: false,
                            migrationsRun: false,
                            dropSchema: false,
                            logging: false
                        });
                        return [4 /*yield*/, index_1.createConnection(connectionOptions)];
                    case 7:
                        connection = _a.sent();
                        return [4 /*yield*/, connection.driver.createSchemaBuilder().log()];
                    case 8:
                        sqlInMemory = _a.sent();
                        upSqls_1 = [], downSqls_1 = [];
                        // mysql is exceptional here because it uses ` character in to escape names in queries, that's why for mysql
                        // we are using simple quoted string instead of template string syntax
                        if (connection.driver instanceof MysqlDriver_1.MysqlDriver || connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver) {
                            sqlInMemory.upQueries.forEach(function (upQuery) {
                                upSqls_1.push("        await queryRunner.query(\"" + upQuery.query.replace(new RegExp("\"", "g"), "\\\"") + "\", " + JSON.stringify(upQuery.parameters) + ");");
                            });
                            sqlInMemory.downQueries.forEach(function (downQuery) {
                                downSqls_1.push("        await queryRunner.query(\"" + downQuery.query.replace(new RegExp("\"", "g"), "\\\"") + "\", " + JSON.stringify(downQuery.parameters) + ");");
                            });
                        }
                        else {
                            sqlInMemory.upQueries.forEach(function (upQuery) {
                                upSqls_1.push("        await queryRunner.query(`" + upQuery.query.replace(new RegExp("`", "g"), "\\`") + "`, " + JSON.stringify(upQuery.parameters) + ");");
                            });
                            sqlInMemory.downQueries.forEach(function (downQuery) {
                                downSqls_1.push("        await queryRunner.query(`" + downQuery.query.replace(new RegExp("`", "g"), "\\`") + "`, " + JSON.stringify(downQuery.parameters) + ");");
                            });
                        }
                        if (!upSqls_1.length) return [3 /*break*/, 12];
                        if (!args.name) return [3 /*break*/, 10];
                        fileContent = MigrationGenerateCommand.getTemplate(args.name, timestamp, upSqls_1, downSqls_1.reverse());
                        path = process.cwd() + "/" + (directory ? (directory + "/") : "") + filename;
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.createFile(path, fileContent)];
                    case 9:
                        _a.sent();
                        console.log(chalk.green("Migration " + chalk.blue(path) + " has been generated successfully."));
                        return [3 /*break*/, 11];
                    case 10:
                        console.log(chalk.yellow("Please specify migration name"));
                        _a.label = 11;
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        console.log(chalk.yellow("No changes in database schema were found - cannot generate a migration. To create a new empty migration use \"typeorm migration:create\" command"));
                        _a.label = 13;
                    case 13: return [4 /*yield*/, connection.close()];
                    case 14:
                        _a.sent();
                        return [3 /*break*/, 18];
                    case 15:
                        err_2 = _a.sent();
                        if (!connection) return [3 /*break*/, 17];
                        return [4 /*yield*/, connection.close()];
                    case 16:
                        _a.sent();
                        _a.label = 17;
                    case 17:
                        console.log(chalk.black.bgRed("Error during migration generation:"));
                        console.error(err_2);
                        process.exit(1);
                        return [3 /*break*/, 18];
                    case 18: return [2 /*return*/];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------
    /**
     * Gets contents of the migration file.
     */
    MigrationGenerateCommand.getTemplate = function (name, timestamp, upSqls, downSqls) {
        return "import {MigrationInterface, QueryRunner} from \"typeorm\";\n\nexport class " + StringUtils_1.camelCase(name, true) + timestamp + " implements MigrationInterface {\n\n    public async up(queryRunner: QueryRunner): Promise<any> {\n" + upSqls.join("\n") + "\n    }\n\n    public async down(queryRunner: QueryRunner): Promise<any> {\n" + downSqls.join("\n") + "\n    }\n\n}\n";
    };
    return MigrationGenerateCommand;
}());
exports.MigrationGenerateCommand = MigrationGenerateCommand;
//# sourceMappingURL=MigrationGenerateCommand.js.map