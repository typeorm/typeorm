"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationShowCommand = void 0;
const tslib_1 = require("tslib");
const process = tslib_1.__importStar(require("process"));
const PlatformTools_1 = require("../platform/PlatformTools");
const path_1 = tslib_1.__importDefault(require("path"));
const CommandUtils_1 = require("./CommandUtils");
/**
 * Shows all migrations and whether they have been run or not.
 */
class MigrationShowCommand {
    constructor() {
        this.command = "migration:show";
        this.describe = "Show all migrations and whether they have been run or not";
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
            dataSource = await CommandUtils_1.CommandUtils.loadDataSource(path_1.default.resolve(process.cwd(), args.dataSource));
            dataSource.setOptions({
                subscribers: [],
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: ["schema"],
            });
            await dataSource.initialize();
            await dataSource.showMigrations();
            await dataSource.destroy();
            process.exit(0);
        }
        catch (err) {
            if (dataSource)
                await dataSource.destroy();
            PlatformTools_1.PlatformTools.logCmdErr("Error during migration show:", err);
            process.exit(1);
        }
    }
}
exports.MigrationShowCommand = MigrationShowCommand;

//# sourceMappingURL=MigrationShowCommand.js.map
