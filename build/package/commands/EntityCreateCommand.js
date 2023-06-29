"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityCreateCommand = void 0;
const tslib_1 = require("tslib");
const ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
const CommandUtils_1 = require("./CommandUtils");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Generates a new entity.
 */
class EntityCreateCommand {
    constructor() {
        this.command = "entity:create";
        this.describe = "Generates a new entity.";
    }
    builder(args) {
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
    }
    handler(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const fileContent = EntityCreateCommand.getTemplate(args.name);
                const filename = args.name + ".ts";
                let directory = args.dir;
                // if directory is not set then try to open tsconfig and find default path there
                if (!directory) {
                    try {
                        const connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({
                            root: process.cwd(),
                            configName: args.config
                        });
                        const connectionOptions = yield connectionOptionsReader.get(args.connection);
                        directory = connectionOptions.cli ? (connectionOptions.cli.entitiesDir || "") : "";
                    }
                    catch (err) { }
                }
                if (directory && !directory.startsWith("/")) {
                    directory = process.cwd() + "/" + directory;
                }
                const path = (directory ? (directory + "/") : "") + filename;
                const fileExists = yield CommandUtils_1.CommandUtils.fileExists(path);
                if (fileExists) {
                    throw `File ${chalk_1.default.blue(path)} already exists`;
                }
                yield CommandUtils_1.CommandUtils.createFile(path, fileContent);
                console.log(chalk_1.default.green(`Entity ${chalk_1.default.blue(path)} has been created successfully.`));
            }
            catch (err) {
                console.log(chalk_1.default.black.bgRed("Error during entity creation:"));
                console.error(err);
                process.exit(1);
            }
        });
    }
    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------
    /**
     * Gets contents of the entity file.
     */
    static getTemplate(name) {
        return `import {Entity} from "typeorm";

@Entity()
export class ${name} {

}
`;
    }
}
exports.EntityCreateCommand = EntityCreateCommand;

//# sourceMappingURL=EntityCreateCommand.js.map
