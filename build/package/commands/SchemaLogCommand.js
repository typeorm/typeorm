"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaLogCommand = void 0;
const tslib_1 = require("tslib");
const cli_highlight_1 = require("cli-highlight");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const PlatformTools_1 = require("../platform/PlatformTools");
const path_1 = tslib_1.__importDefault(require("path"));
const process_1 = tslib_1.__importDefault(require("process"));
const CommandUtils_1 = require("./CommandUtils");
/**
 * Shows sql to be executed by schema:sync command.
 */
class SchemaLogCommand {
    constructor() {
        this.command = "schema:log";
        this.describe = "Shows sql to be executed by schema:sync command. It shows sql log only for your default dataSource. " +
            "To run update queries on a concrete connection use -c option.";
    }
    builder(args) {
        return args.option("dataSource", {
            alias: "d",
            describe: "Path to the file where your DataSource instance is defined.",
            demandOption: true,
        });
    }
    async handler(args) {
        let dataSource = undefined;
        try {
            dataSource = await CommandUtils_1.CommandUtils.loadDataSource(path_1.default.resolve(process_1.default.cwd(), args.dataSource));
            dataSource.setOptions({
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: false,
            });
            await dataSource.initialize();
            const sqlInMemory = await dataSource.driver
                .createSchemaBuilder()
                .log();
            if (sqlInMemory.upQueries.length === 0) {
                console.log(chalk_1.default.yellow("Your schema is up to date - there are no queries to be executed by schema synchronization."));
            }
            else {
                const lengthSeparators = String(sqlInMemory.upQueries.length)
                    .split("")
                    .map((char) => "-")
                    .join("");
                console.log(chalk_1.default.yellow("---------------------------------------------------------------" +
                    lengthSeparators));
                console.log(chalk_1.default.yellow.bold(`-- Schema synchronization will execute following sql queries (${chalk_1.default.white(sqlInMemory.upQueries.length.toString())}):`));
                console.log(chalk_1.default.yellow("---------------------------------------------------------------" +
                    lengthSeparators));
                sqlInMemory.upQueries.forEach((upQuery) => {
                    let sqlString = upQuery.query;
                    sqlString = sqlString.trim();
                    sqlString =
                        sqlString.substr(-1) === ";"
                            ? sqlString
                            : sqlString + ";";
                    console.log((0, cli_highlight_1.highlight)(sqlString));
                });
            }
            await dataSource.destroy();
        }
        catch (err) {
            if (dataSource)
                PlatformTools_1.PlatformTools.logCmdErr("Error during schema synchronization:", err);
            process_1.default.exit(1);
        }
    }
}
exports.SchemaLogCommand = SchemaLogCommand;

//# sourceMappingURL=SchemaLogCommand.js.map
