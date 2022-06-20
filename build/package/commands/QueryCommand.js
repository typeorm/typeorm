"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryCommand = void 0;
const tslib_1 = require("tslib");
const PlatformTools_1 = require("../platform/PlatformTools");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const path_1 = tslib_1.__importDefault(require("path"));
const process_1 = tslib_1.__importDefault(require("process"));
const CommandUtils_1 = require("./CommandUtils");
/**
 * Executes an SQL query on the given dataSource.
 */
class QueryCommand {
    constructor() {
        this.command = "query [query]";
        this.describe = "Executes given SQL query on a default dataSource. Specify connection name to run query on a specific dataSource.";
    }
    builder(args) {
        return args
            .positional("query", {
            describe: "The SQL Query to run",
            type: "string",
        })
            .option("dataSource", {
            alias: "d",
            describe: "Path to the file where your DataSource instance is defined.",
            demandOption: true,
        });
    }
    async handler(args) {
        let queryRunner = undefined;
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
            // create a query runner and execute query using it
            queryRunner = dataSource.createQueryRunner();
            const query = args.query;
            console.log(chalk_1.default.green("Running query: ") +
                PlatformTools_1.PlatformTools.highlightSql(query));
            const queryResult = await queryRunner.query(query);
            if (typeof queryResult === "undefined") {
                console.log(chalk_1.default.green("Query has been executed. No result was returned."));
            }
            else {
                console.log(chalk_1.default.green("Query has been executed. Result: "));
                console.log(PlatformTools_1.PlatformTools.highlightJson(JSON.stringify(queryResult, undefined, 2)));
            }
            await queryRunner.release();
            await dataSource.destroy();
        }
        catch (err) {
            if (queryRunner)
                await queryRunner.release();
            if (dataSource)
                await dataSource.destroy();
            PlatformTools_1.PlatformTools.logCmdErr("Error during query execution:", err);
            process_1.default.exit(1);
        }
    }
}
exports.QueryCommand = QueryCommand;

//# sourceMappingURL=QueryCommand.js.map
