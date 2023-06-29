"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationCreateCommand = void 0;
const tslib_1 = require("tslib");
const ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
const CommandUtils_1 = require("./CommandUtils");
const StringUtils_1 = require("../util/StringUtils");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Creates a new migration file.
 */
class MigrationCreateCommand {
    constructor() {
        this.command = "migration:create";
        this.describe = "Creates a new migration file.";
        this.aliases = "migrations:create";
    }
    builder(args) {
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
    }
    handler(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (args._[0] === "migrations:create") {
                console.log("'migrations:create' is deprecated, please use 'migration:create' instead");
            }
            try {
                const timestamp = new Date().getTime();
                const fileContent = args.outputJs ?
                    MigrationCreateCommand.getJavascriptTemplate(args.name, timestamp)
                    : MigrationCreateCommand.getTemplate(args.name, timestamp);
                const extension = args.outputJs ? ".js" : ".ts";
                const filename = timestamp + "-" + args.name + extension;
                let directory = args.dir;
                // if directory is not set then try to open tsconfig and find default path there
                if (!directory) {
                    try {
                        const connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({
                            root: process.cwd(),
                            configName: args.config
                        });
                        const connectionOptions = yield connectionOptionsReader.get(args.connection);
                        directory = connectionOptions.cli ? (connectionOptions.cli.migrationsDir || "") : "";
                    }
                    catch (err) { }
                }
                if (directory && !directory.startsWith("/")) {
                    directory = process.cwd() + "/" + directory;
                }
                const path = (directory ? (directory + "/") : "") + filename;
                yield CommandUtils_1.CommandUtils.createFile(path, fileContent);
                console.log(`Migration ${chalk_1.default.blue(path)} has been generated successfully.`);
            }
            catch (err) {
                console.log(chalk_1.default.black.bgRed("Error during migration creation:"));
                console.error(err);
                process.exit(1);
            }
        });
    }
    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------
    /**
     * Gets contents of the migration file.
     */
    static getTemplate(name, timestamp) {
        return `import {MigrationInterface, QueryRunner} from "typeorm";

export class ${(0, StringUtils_1.camelCase)(name, true)}${timestamp} implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
`;
    }
    /**
     * Gets contents of the migration file in Javascript.
     */
    static getJavascriptTemplate(name, timestamp) {
        return `const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class ${(0, StringUtils_1.camelCase)(name, true)}${timestamp} {

    async up(queryRunner) {
    }

    async down(queryRunner) {
    }
}
        `;
    }
}
exports.MigrationCreateCommand = MigrationCreateCommand;

//# sourceMappingURL=MigrationCreateCommand.js.map
