"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationCreateCommand = void 0;
var tslib_1 = require("tslib");
var ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
var CommandUtils_1 = require("./CommandUtils");
var StringUtils_1 = require("../util/StringUtils");
var chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Creates a new migration file.
 */
var MigrationCreateCommand = /** @class */ (function () {
    function MigrationCreateCommand() {
        this.command = "migration:create";
        this.describe = "Creates a new migration file.";
        this.aliases = "migrations:create";
    }
    MigrationCreateCommand.prototype.builder = function (args) {
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
        })
            .option("o", {
            alias: "outputJs",
            type: "boolean",
            default: false,
            describe: "Generate a migration file on Javascript instead of Typescript",
        });
    };
    MigrationCreateCommand.prototype.handler = function (args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var timestamp, fileContent, extension, filename, directory, connectionOptionsReader, connectionOptions, err_1, path, err_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (args._[0] === "migrations:create") {
                            console.log("'migrations:create' is deprecated, please use 'migration:create' instead");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        timestamp = new Date().getTime();
                        fileContent = args.outputJs ?
                            MigrationCreateCommand.getJavascriptTemplate(args.name, timestamp)
                            : MigrationCreateCommand.getTemplate(args.name, timestamp);
                        extension = args.outputJs ? ".js" : ".ts";
                        filename = timestamp + "-" + args.name + extension;
                        directory = args.dir;
                        if (!!directory) return [3 /*break*/, 5];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({
                            root: process.cwd(),
                            configName: args.config
                        });
                        return [4 /*yield*/, connectionOptionsReader.get(args.connection)];
                    case 3:
                        connectionOptions = _a.sent();
                        directory = connectionOptions.cli ? (connectionOptions.cli.migrationsDir || "") : "";
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        if (directory && !directory.startsWith("/")) {
                            directory = process.cwd() + "/" + directory;
                        }
                        path = (directory ? (directory + "/") : "") + filename;
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.createFile(path, fileContent)];
                    case 6:
                        _a.sent();
                        console.log("Migration " + chalk_1.default.blue(path) + " has been generated successfully.");
                        return [3 /*break*/, 8];
                    case 7:
                        err_2 = _a.sent();
                        console.log(chalk_1.default.black.bgRed("Error during migration creation:"));
                        console.error(err_2);
                        process.exit(1);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
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
    MigrationCreateCommand.getTemplate = function (name, timestamp) {
        return "import {MigrationInterface, QueryRunner} from \"typeorm\";\n\nexport class " + StringUtils_1.camelCase(name, true) + timestamp + " implements MigrationInterface {\n\n    public async up(queryRunner: QueryRunner): Promise<void> {\n    }\n\n    public async down(queryRunner: QueryRunner): Promise<void> {\n    }\n\n}\n";
    };
    /**
     * Gets contents of the migration file in Javascript.
     */
    MigrationCreateCommand.getJavascriptTemplate = function (name, timestamp) {
        return "const { MigrationInterface, QueryRunner } = require(\"typeorm\");\n\nmodule.exports = class " + StringUtils_1.camelCase(name, true) + timestamp + " {\n\n    async up(queryRunner) {\n    }\n\n    async down(queryRunner) {\n    }\n}\n        ";
    };
    return MigrationCreateCommand;
}());
exports.MigrationCreateCommand = MigrationCreateCommand;

//# sourceMappingURL=MigrationCreateCommand.js.map
