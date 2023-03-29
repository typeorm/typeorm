"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityCreateCommand = void 0;
var tslib_1 = require("tslib");
var ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
var CommandUtils_1 = require("./CommandUtils");
var chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Generates a new entity.
 */
var EntityCreateCommand = /** @class */ (function () {
    function EntityCreateCommand() {
        this.command = "entity:create";
        this.describe = "Generates a new entity.";
    }
    EntityCreateCommand.prototype.builder = function (args) {
        return args
            .option("c", {
            alias: "connection",
            default: "default",
            describe: "Name of the connection on which to run a query"
        })
            .option("n", {
            alias: "name",
            describe: "Name of the entity class.",
            demand: true
        })
            .option("d", {
            alias: "dir",
            describe: "Directory where entity should be created."
        })
            .option("f", {
            alias: "config",
            default: "ormconfig",
            describe: "Name of the file with connection configuration."
        });
    };
    EntityCreateCommand.prototype.handler = function (args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var fileContent, filename, directory, connectionOptionsReader, connectionOptions, err_1, path, fileExists, err_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        fileContent = EntityCreateCommand.getTemplate(args.name);
                        filename = args.name + ".ts";
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
                        directory = connectionOptions.cli ? (connectionOptions.cli.entitiesDir || "") : "";
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        if (directory && !directory.startsWith("/")) {
                            directory = process.cwd() + "/" + directory;
                        }
                        path = (directory ? (directory + "/") : "") + filename;
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.fileExists(path)];
                    case 5:
                        fileExists = _a.sent();
                        if (fileExists) {
                            throw "File " + chalk_1.default.blue(path) + " already exists";
                        }
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.createFile(path, fileContent)];
                    case 6:
                        _a.sent();
                        console.log(chalk_1.default.green("Entity " + chalk_1.default.blue(path) + " has been created successfully."));
                        return [3 /*break*/, 8];
                    case 7:
                        err_2 = _a.sent();
                        console.log(chalk_1.default.black.bgRed("Error during entity creation:"));
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
     * Gets contents of the entity file.
     */
    EntityCreateCommand.getTemplate = function (name) {
        return "import {Entity} from \"typeorm\";\n\n@Entity()\nexport class " + name + " {\n\n}\n";
    };
    return EntityCreateCommand;
}());
exports.EntityCreateCommand = EntityCreateCommand;

//# sourceMappingURL=EntityCreateCommand.js.map
