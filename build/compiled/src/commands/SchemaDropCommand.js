"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaDropCommand = void 0;
const tslib_1 = require("tslib");
const index_1 = require("../index");
const ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Drops all tables of the database from the given connection.
 */
class SchemaDropCommand {
    constructor() {
        this.command = "schema:drop";
        this.describe = "Drops all tables in the database on your default connection. " +
            "To drop table of a concrete connection's database use -c option.";
    }
    builder(args) {
        return args
            .option("c", {
            alias: "connection",
            default: "default",
            describe: "Name of the connection on which to drop all tables."
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
                yield connection.dropDatabase();
                yield connection.close();
                console.log(chalk_1.default.green("Database schema has been successfully dropped."));
            }
            catch (err) {
                if (connection)
                    yield connection.close();
                console.log(chalk_1.default.black.bgRed("Error during schema drop:"));
                console.error(err);
                process.exit(1);
            }
        });
    }
}
exports.SchemaDropCommand = SchemaDropCommand;
//# sourceMappingURL=SchemaDropCommand.js.map