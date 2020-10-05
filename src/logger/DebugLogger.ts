import debug from "debug";
import {Logger} from "./Logger";
import {QueryRunner} from "../";
import {PlatformTools} from "../platform/PlatformTools";

/**
 * Performs logging of the events in TypeORM via debug library.
 */
export class DebugLogger implements Logger {
    private debugQueryLog = debug("typeorm:query:log");
    private debugQueryError = debug("typeorm:query:error");
    private debugQuerySlow = debug("typeorm:query:slow");
    private debugSchemaBuild = debug("typeorm:schema");
    private debugMigration = debug("typeorm:migration");

    private debugLog = debug("typeorm:log");
    private debugInfo = debug("typeorm:info");
    private debugWarn = debug("typeorm:warn");

    /**
     * Logs query and parameters used in it.
     */
    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (this.debugQueryLog.enabled) {
            this.debugQueryLog(PlatformTools.highlightSql(query) + ";");
            if (parameters && parameters.length) {
                this.debugQueryLog("parameters:", parameters);
            }
        }
    }

    /**
     * Logs query that failed.
     */
    logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (this.debugQueryError.enabled) {
            this.debugQueryError(PlatformTools.highlightSql(query) + ";");
            if (parameters && parameters.length) {
                this.debugQueryError("parameters:", parameters);
            }
            this.debugQueryError("error: ", error);
        }
    }

    /**
     * Logs query that is slow.
     */
    logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (this.debugQuerySlow.enabled) {
            this.debugQuerySlow(PlatformTools.highlightSql(query) + ";");
            if (parameters && parameters.length) {
                this.debugQuerySlow("parameters:", parameters);
            }
            this.debugQuerySlow("execution time:", time);
        }
    }

    /**
     * Logs events from the schema build process.
     */
    logSchemaBuild(message: string, queryRunner?: QueryRunner) {
        if (this.debugSchemaBuild.enabled) {
            this.debugSchemaBuild(message);
        }
    }

    /**
     * Logs events from the migration run process.
     */
    logMigration(message: string, queryRunner?: QueryRunner) {
        if (this.debugMigration.enabled) {
            this.debugMigration(message);
        }
    }

    /**
     * Perform logging using given logger.
     * Log has its own level and message.
     */
    log(level: "log" | "info" | "warn", message: any, queryRunner?: QueryRunner) {
        switch (level) {
            case "log":
                if (this.debugLog.enabled) {
                    this.debugLog(message);
                }
                break;
            case "info":
                if (this.debugInfo.enabled) {
                    this.debugInfo(message);
                }
                break;
            case "warn":
                if (this.debugWarn.enabled) {
                    this.debugWarn(message);
                }
                break;
        }
    }
}
