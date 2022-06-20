"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaSyncCommand = void 0;
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const PlatformTools_1 = require("../platform/PlatformTools");
const path_1 = tslib_1.__importDefault(require("path"));
const process_1 = tslib_1.__importDefault(require("process"));
const CommandUtils_1 = require("./CommandUtils");
/**
 * Synchronizes database schema with entities.
 */
class SchemaSyncCommand {
    constructor() {
        this.command = "schema:sync";
        this.describe = "Synchronizes your entities with database schema. It runs schema update queries on all connections you have. " +
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
                logging: ["query", "schema"],
            });
            await dataSource.initialize();
            await dataSource.synchronize();
            await dataSource.destroy();
            console.log(chalk_1.default.green("Schema synchronization finished successfully."));
        }
        catch (err) {
            if (dataSource)
                await dataSource.destroy();
            PlatformTools_1.PlatformTools.logCmdErr("Error during schema synchronization:", err);
            process_1.default.exit(1);
        }
    }
}
exports.SchemaSyncCommand = SchemaSyncCommand;

//# sourceMappingURL=SchemaSyncCommand.js.map
