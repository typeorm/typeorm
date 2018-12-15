import {Logger} from "./Logger";
import {QueryRunner} from "../";
import {PlatformTools} from "../platform/PlatformTools";

/**
 * Performs logging of the events in TypeORM via debug library.
 */
export class DebugLogger implements Logger {
    private debugPromise = import("debug");

    private debugQueryLogPromise = this.debugPromise.then(debug => debug("typeorm:query:log"));
    private debugQueryErrorPromise = this.debugPromise.then(debug => debug("typeorm:query:error"));
    private debugQuerySlowPromise = this.debugPromise.then(debug => debug("typeorm:query:slow"));
    private debugSchemaBuildPromise = this.debugPromise.then(debug => debug("typeorm:schema"));
    private debugMigrationPromise = this.debugPromise.then(debug => debug("typeorm:migration"));

    private debugLogPromise = this.debugPromise.then(debug => debug("typeorm:log"));
    private debugInfoPromise = this.debugPromise.then(debug => debug("typeorm:info"));
    private debugWarnPromise = this.debugPromise.then(debug => debug("typeorm:warn"));

    /**
     * Logs query and parameters used in it.
     */
    async logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
        const debugQueryLog = await this.debugQueryLogPromise;
        if (debugQueryLog.enabled) {
            debugQueryLog(PlatformTools.highlightSql(query) + ";");
            if (parameters && parameters.length) {
                debugQueryLog("parameters:", parameters);
            }
        }
    }

    /**
     * Logs query that failed.
     */
    async logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        const debugQueryError = await this.debugQueryErrorPromise;
        if (debugQueryError.enabled) {
            debugQueryError(PlatformTools.highlightSql(query) + ";");
            if (parameters && parameters.length) {
                debugQueryError("parameters:", parameters);
            }
            debugQueryError("error: ", error);
        }
    }

    /**
     * Logs query that is slow.
     */
    async logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        const debugQuerySlow = await this.debugQuerySlowPromise;
        if (debugQuerySlow.enabled) {
            debugQuerySlow(PlatformTools.highlightSql(query) + ";");
            if (parameters && parameters.length) {
                debugQuerySlow("parameters:", parameters);
            }
            debugQuerySlow("execution time:", time);
        }
    }

    /**
     * Logs events from the schema build process.
     */
    async logSchemaBuild(message: string, queryRunner?: QueryRunner) {
        const debugSchemaBuild = await this.debugSchemaBuildPromise;
        if (debugSchemaBuild.enabled) {
            debugSchemaBuild(message);
        }
    }

    /**
     * Logs events from the migration run process.
     */
    async logMigration(message: string, queryRunner?: QueryRunner) {
        const debugMigration = await this.debugMigrationPromise;
        if (debugMigration.enabled) {
            debugMigration(message);
        }
    }

    /**
     * Perform logging using given logger.
     * Log has its own level and message.
     */
    async log(level: "log" | "info" | "warn", message: any, queryRunner?: QueryRunner) {
        switch (level) {
            case "log":
                const debugLog = await this.debugLogPromise;
                if (debugLog.enabled) {
                    debugLog(message);
                }
                break;
            case "info":
                const debugInfo = await this.debugInfoPromise;
                if (debugInfo.enabled) {
                    debugInfo(message);
                }
                break;
            case "warn":
                const debugWarn = await this.debugWarnPromise;
                if (debugWarn.enabled) {
                    debugWarn(message);
                }
                break;
        }
    }
}
