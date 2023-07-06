"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationGenerateCommand = void 0;
const tslib_1 = require("tslib");
const ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
const CommandUtils_1 = require("./CommandUtils");
const index_1 = require("../index");
const MysqlDriver_1 = require("../driver/mysql/MysqlDriver");
const StringUtils_1 = require("../util/StringUtils");
const AuroraDataApiDriver_1 = require("../driver/aurora-data-api/AuroraDataApiDriver");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const sqlFormatter_1 = require("@sqltools/formatter/lib/sqlFormatter");
/**
 * Generates a new migration file with sql needs to be executed to update schema.
 */
class MigrationGenerateCommand {
    constructor() {
        this.command = "migration:generate";
        this.describe = "Generates a new migration file with sql needs to be executed to update schema.";
        this.aliases = "migrations:generate";
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
            demand: true,
            type: "string"
        })
            .option("d", {
            alias: "dir",
            describe: "Directory where migration should be created."
        })
            .option("p", {
            alias: "pretty",
            type: "boolean",
            default: false,
            describe: "Pretty-print generated SQL",
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
        })
            .option("dr", {
            alias: "dryrun",
            type: "boolean",
            default: false,
            describe: "Prints out the contents of the migration instead of writing it to a file",
        })
            .option("ch", {
            alias: "check",
            type: "boolean",
            default: false,
            describe: "Verifies that the current database is up to date and that no migrations are needed. Otherwise exits with code 1.",
        });
    }
    handler(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (args._[0] === "migrations:generate") {
                console.log("'migrations:generate' is deprecated, please use 'migration:generate' instead");
            }
            const timestamp = new Date().getTime();
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
                    directory = connectionOptions.cli ? connectionOptions.cli.migrationsDir : undefined;
                }
                catch (err) { }
            }
            try {
                const connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({
                    root: process.cwd(),
                    configName: args.config
                });
                const connectionOptions = yield connectionOptionsReader.get(args.connection);
                Object.assign(connectionOptions, {
                    synchronize: false,
                    migrationsRun: false,
                    dropSchema: false,
                    logging: false
                });
                const upSqls = [], downSqls = [];
                const connection = yield (0, index_1.createConnection)(connectionOptions);
                try {
                    const sqlInMemory = yield connection.driver.createSchemaBuilder().log();
                    if (args.pretty) {
                        sqlInMemory.upQueries.forEach(upQuery => {
                            upQuery.query = MigrationGenerateCommand.prettifyQuery(upQuery.query);
                        });
                        sqlInMemory.downQueries.forEach(downQuery => {
                            downQuery.query = MigrationGenerateCommand.prettifyQuery(downQuery.query);
                        });
                    }
                    // mysql is exceptional here because it uses ` character in to escape names in queries, that's why for mysql
                    // we are using simple quoted string instead of template string syntax
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver || connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver) {
                        sqlInMemory.upQueries.forEach(upQuery => {
                            upSqls.push("        await queryRunner.query(\"" + upQuery.query.replace(new RegExp(`"`, "g"), `\\"`) + "\"" + MigrationGenerateCommand.queryParams(upQuery.parameters) + ");");
                        });
                        sqlInMemory.downQueries.forEach(downQuery => {
                            downSqls.push("        await queryRunner.query(\"" + downQuery.query.replace(new RegExp(`"`, "g"), `\\"`) + "\"" + MigrationGenerateCommand.queryParams(downQuery.parameters) + ");");
                        });
                    }
                    else {
                        sqlInMemory.upQueries.forEach(upQuery => {
                            upSqls.push("        await queryRunner.query(`" + upQuery.query.replace(new RegExp("`", "g"), "\\`") + "`" + MigrationGenerateCommand.queryParams(upQuery.parameters) + ");");
                        });
                        sqlInMemory.downQueries.forEach(downQuery => {
                            downSqls.push("        await queryRunner.query(`" + downQuery.query.replace(new RegExp("`", "g"), "\\`") + "`" + MigrationGenerateCommand.queryParams(downQuery.parameters) + ");");
                        });
                    }
                }
                finally {
                    yield connection.close();
                }
                if (!upSqls.length) {
                    if (args.check) {
                        console.log(chalk_1.default.green(`No changes in database schema were found`));
                        process.exit(0);
                    }
                    else {
                        console.log(chalk_1.default.yellow(`No changes in database schema were found - cannot generate a migration. To create a new empty migration use "typeorm migration:create" command`));
                        process.exit(1);
                    }
                }
                else if (!args.name) {
                    console.log(chalk_1.default.yellow("Please specify a migration name using the `-n` argument"));
                    process.exit(1);
                }
                const fileContent = args.outputJs ?
                    MigrationGenerateCommand.getJavascriptTemplate(args.name, timestamp, upSqls, downSqls.reverse()) :
                    MigrationGenerateCommand.getTemplate(args.name, timestamp, upSqls, downSqls.reverse());
                const path = process.cwd() + "/" + (directory ? (directory + "/") : "") + filename;
                if (args.check) {
                    console.log(chalk_1.default.yellow(`Unexpected changes in database schema were found in check mode:\n\n${chalk_1.default.white(fileContent)}`));
                    process.exit(1);
                }
                if (args.dryrun) {
                    console.log(chalk_1.default.green(`Migration ${chalk_1.default.blue(path)} has content:\n\n${chalk_1.default.white(fileContent)}`));
                }
                else {
                    yield CommandUtils_1.CommandUtils.createFile(path, fileContent);
                    console.log(chalk_1.default.green(`Migration ${chalk_1.default.blue(path)} has been generated successfully.`));
                }
            }
            catch (err) {
                console.log(chalk_1.default.black.bgRed("Error during migration generation:"));
                console.error(err);
                process.exit(1);
            }
        });
    }
    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------
    /**
     * Formats query parameters for migration queries if parameters actually exist
     */
    static queryParams(parameters) {
        if (!parameters || !parameters.length) {
            return "";
        }
        return `, ${JSON.stringify(parameters)}`;
    }
    /**
     * Gets contents of the migration file.
     */
    static getTemplate(name, timestamp, upSqls, downSqls) {
        const migrationName = `${(0, StringUtils_1.camelCase)(name, true)}${timestamp}`;
        return `import {MigrationInterface, QueryRunner} from "typeorm";

export class ${migrationName} implements MigrationInterface {
    name = '${migrationName}'

    public async up(queryRunner: QueryRunner): Promise<void> {
${upSqls.join(`
`)}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
${downSqls.join(`
`)}
    }

}
`;
    }
    /**
     * Gets contents of the migration file in Javascript.
     */
    static getJavascriptTemplate(name, timestamp, upSqls, downSqls) {
        const migrationName = `${(0, StringUtils_1.camelCase)(name, true)}${timestamp}`;
        return `const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class ${migrationName} {
    name = '${migrationName}'

    async up(queryRunner) {
${upSqls.join(`
`)}
    }

    async down(queryRunner) {
${downSqls.join(`
`)}
    }
}
`;
    }
    /**
     *
     */
    static prettifyQuery(query) {
        const formattedQuery = (0, sqlFormatter_1.format)(query, { indent: "    " });
        return "\n" + formattedQuery.replace(/^/gm, "            ") + "\n        ";
    }
}
exports.MigrationGenerateCommand = MigrationGenerateCommand;
//# sourceMappingURL=MigrationGenerateCommand.js.map