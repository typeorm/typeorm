"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationRevertCommand = void 0;
const tslib_1 = require("tslib");
const index_1 = require("../index");
const ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Reverts last migration command.
 */
class MigrationRevertCommand {
    constructor() {
        this.command = "migration:revert";
        this.describe = "Reverts last executed migration.";
        this.aliases = "migrations:revert";
    }
    builder(args) {
        return args
            .option("c", {
            alias: "connection",
            default: "default",
            describe: "Name of the connection on which run a query."
        })
            .option("transaction", {
            alias: "t",
            default: "default",
            describe: "Indicates if transaction should be used or not for migration revert. Enabled by default."
        })
            .option("f", {
            alias: "config",
            default: "ormconfig",
            describe: "Name of the file with connection configuration."
        });
    }
    handler(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (args._[0] === "migrations:revert") {
                console.log("'migrations:revert' is deprecated, please use 'migration:revert' instead");
            }
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
                    logging: ["query", "error", "schema"]
                });
                connection = yield (0, index_1.createConnection)(connectionOptions);
                const options = {
                    transaction: "all",
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
                yield connection.undoLastMigration(options);
                yield connection.close();
            }
            catch (err) {
                if (connection)
                    yield connection.close();
                console.log(chalk_1.default.black.bgRed("Error during migration revert:"));
                console.error(err);
                process.exit(1);
            }
        });
    }
}
exports.MigrationRevertCommand = MigrationRevertCommand;
//# sourceMappingURL=MigrationRevertCommand.js.map