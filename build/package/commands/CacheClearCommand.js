"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheClearCommand = void 0;
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const PlatformTools_1 = require("../platform/PlatformTools");
const path_1 = tslib_1.__importDefault(require("path"));
const process_1 = tslib_1.__importDefault(require("process"));
const CommandUtils_1 = require("./CommandUtils");
/**
 * Clear cache command.
 */
class CacheClearCommand {
    constructor() {
        this.command = "cache:clear";
        this.describe = "Clears all data stored in query runner cache.";
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
                subscribers: [],
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: ["schema"],
            });
            await dataSource.initialize();
            if (!dataSource.queryResultCache) {
                PlatformTools_1.PlatformTools.logCmdErr("Cache is not enabled. To use cache enable it in connection configuration.");
                return;
            }
            await dataSource.queryResultCache.clear();
            console.log(chalk_1.default.green("Cache was successfully cleared"));
            await dataSource.destroy();
        }
        catch (err) {
            if (dataSource)
                await dataSource.destroy();
            PlatformTools_1.PlatformTools.logCmdErr("Error during cache clear.", err);
            process_1.default.exit(1);
        }
    }
}
exports.CacheClearCommand = CacheClearCommand;

//# sourceMappingURL=CacheClearCommand.js.map
