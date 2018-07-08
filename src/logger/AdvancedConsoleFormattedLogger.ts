import {LoggerOptions} from "./LoggerOptions";
import {QueryRunner} from "../query-runner/QueryRunner";
import {Logger} from "./Logger";
import { AdvancedConsoleLogger } from "./AdvancedConsoleLogger";
const sqlFormatter  = require("sql-formatter"); // use require because there"s no type definition

/**
 * Performs logging of the events in TypeORM.
 * This version of logger uses console to log events and use syntax highlighting.
 */
export class AdvancedConsoleFormattedLogger extends AdvancedConsoleLogger implements Logger {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options?: LoggerOptions) {
        super(options);
    }

    public logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
        super.logQuery("\n" + sqlFormatter.format(query) + "\n\n", parameters, queryRunner);
    }
}