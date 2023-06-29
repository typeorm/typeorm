"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheClearCommand = void 0;
const tslib_1 = require("tslib");
const index_1 = require("../index");
const ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Clear cache command.
 */
class CacheClearCommand {
    constructor() {
        this.command = "cache:clear";
        this.describe = "Clears all data stored in query runner cache.";
    }
    builder(args) {
        return args
            .option("connection", {
            alias: "c",
            default: "default",
            describe: "Name of the connection on which run a query."
        })
            .option("config", {
            alias: "f",
            default: "ormconfig",
            describe: "Name of the file with connection configuration."
        });
    }
    handler(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let connection = undefined;
            try {
                const connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({
                    root: process.cwd(),
                    configName: args.config
                });
                const connectionOptions = yield connectionOptionsReader.get(args.connection);
                Object.assign(connectionOptions, {
                    subscribers: [],
                    synchronize: false,
                    migrationsRun: false,
                    dropSchema: false,
                    logging: ["schema"]
                });
                connection = yield (0, index_1.createConnection)(connectionOptions);
                if (!connection.queryResultCache) {
                    console.log(chalk_1.default.black.bgRed("Cache is not enabled. To use cache enable it in connection configuration."));
                    return;
                }
                yield connection.queryResultCache.clear();
                console.log(chalk_1.default.green("Cache was successfully cleared"));
                if (connection)
                    yield connection.close();
            }
            catch (err) {
                if (connection)
                    yield connection.close();
                console.log(chalk_1.default.black.bgRed("Error during cache clear:"));
                console.error(err);
                process.exit(1);
            }
        });
    }
}
exports.CacheClearCommand = CacheClearCommand;

//# sourceMappingURL=CacheClearCommand.js.map
