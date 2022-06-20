"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationRunCommand = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const process = tslib_1.__importStar(require("process"));
const PlatformTools_1 = require("../platform/PlatformTools");
const CommandUtils_1 = require("./CommandUtils");
/**
 * Runs migration command.
 */
class MigrationRunCommand {
    constructor() {
        this.command = "migration:run";
        this.describe = "Runs all pending migrations.";
    }
    builder(args) {
        return args
            .option("dataSource", {
            alias: "d",
            describe: "Path to the file where your DataSource instance is defined.",
            demandOption: true,
        })
            .option("transaction", {
            alias: "t",
            default: "default",
            describe: "Indicates if transaction should be used or not for migration run. Enabled by default.",
        });
    }
    async handler(args) {
        var _a;
        let dataSource = undefined;
        try {
            dataSource = await CommandUtils_1.CommandUtils.loadDataSource(path_1.default.resolve(process.cwd(), args.dataSource));
            dataSource.setOptions({
                subscribers: [],
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: ["query", "error", "schema"],
            });
            await dataSource.initialize();
            const options = {
                transaction: (_a = dataSource.options.migrationsTransactionMode) !== null && _a !== void 0 ? _a : "all",
            };
            switch (args.t) {
                case "all":
                    options.transaction = "all";
                    break;
                case "none":
                case "false":
                    options.transaction = "none";
                    break;
                case "each":
                    options.transaction = "each";
                    break;
                default:
                // noop
            }
            await dataSource.runMigrations(options);
            await dataSource.destroy();
            // exit process if no errors
            process.exit(0);
        }
        catch (err) {
            if (dataSource)
                await dataSource.destroy();
            PlatformTools_1.PlatformTools.logCmdErr("Error during migration run:", err);
            process.exit(1);
        }
    }
}
exports.MigrationRunCommand = MigrationRunCommand;

//# sourceMappingURL=MigrationRunCommand.js.map
