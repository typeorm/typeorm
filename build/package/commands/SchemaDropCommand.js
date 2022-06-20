"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaDropCommand = void 0;
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const PlatformTools_1 = require("../platform/PlatformTools");
const path_1 = tslib_1.__importDefault(require("path"));
const process_1 = tslib_1.__importDefault(require("process"));
const CommandUtils_1 = require("./CommandUtils");
/**
 * Drops all tables of the database from the given dataSource.
 */
class SchemaDropCommand {
    constructor() {
        this.command = "schema:drop";
        this.describe = "Drops all tables in the database on your default dataSource. " +
            "To drop table of a concrete connection's database use -c option.";
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
                logging: ["query", "schema"],
            });
            await dataSource.initialize();
            await dataSource.dropDatabase();
            await dataSource.destroy();
            console.log(chalk_1.default.green("Database schema has been successfully dropped."));
        }
        catch (err) {
            if (dataSource)
                await dataSource.destroy();
            PlatformTools_1.PlatformTools.logCmdErr("Error during schema drop:", err);
            process_1.default.exit(1);
        }
    }
}
exports.SchemaDropCommand = SchemaDropCommand;

//# sourceMappingURL=SchemaDropCommand.js.map
