"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaSyncCommand = void 0;
const tslib_1 = require("tslib");
const index_1 = require("../index");
const ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
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
        return args
            .option("c", {
            alias: "connection",
            default: "default",
            describe: "Name of the connection on which schema synchronization needs to to run."
        })
            .option("f", {
            alias: "config",
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
                    synchronize: false,
                    migrationsRun: false,
                    dropSchema: false,
                    logging: ["query", "schema"]
                });
                connection = yield (0, index_1.createConnection)(connectionOptions);
                yield connection.synchronize();
                yield connection.close();
                console.log(chalk_1.default.green("Schema syncronization finished successfully."));
            }
            catch (err) {
                if (connection)
                    yield connection.close();
                console.log(chalk_1.default.black.bgRed("Error during schema synchronization:"));
                console.error(err);
                process.exit(1);
            }
        });
    }
}
exports.SchemaSyncCommand = SchemaSyncCommand;

//# sourceMappingURL=SchemaSyncCommand.js.map
