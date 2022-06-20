import appRootPath from "app-root-path";
import { PlatformTools } from "../platform/PlatformTools";
/**
 * Performs logging of the events in TypeORM.
 * This version of logger logs everything into ormlogs.log file.
 */
export class FileLogger {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(options, fileLoggerOptions) {
        this.options = options;
        this.fileLoggerOptions = fileLoggerOptions;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Logs query and parameters used in it.
     */
    logQuery(query, parameters, queryRunner) {
        if (this.options === "all" ||
            this.options === true ||
            (Array.isArray(this.options) &&
                this.options.indexOf("query") !== -1)) {
            const sql = query +
                (parameters && parameters.length
                    ? " -- PARAMETERS: " + this.stringifyParams(parameters)
                    : "");
            this.write("[QUERY]: " + sql);
        }
    }
    /**
     * Logs query that is failed.
     */
    logQueryError(error, query, parameters, queryRunner) {
        if (this.options === "all" ||
            this.options === true ||
            (Array.isArray(this.options) &&
                this.options.indexOf("error") !== -1)) {
            const sql = query +
                (parameters && parameters.length
                    ? " -- PARAMETERS: " + this.stringifyParams(parameters)
                    : "");
            this.write([`[FAILED QUERY]: ${sql}`, `[QUERY ERROR]: ${error}`]);
        }
    }
    /**
     * Logs query that is slow.
     */
    logQuerySlow(time, query, parameters, queryRunner) {
        const sql = query +
            (parameters && parameters.length
                ? " -- PARAMETERS: " + this.stringifyParams(parameters)
                : "");
        this.write(`[SLOW QUERY: ${time} ms]: ` + sql);
    }
    /**
     * Logs events from the schema build process.
     */
    logSchemaBuild(message, queryRunner) {
        if (this.options === "all" ||
            (Array.isArray(this.options) &&
                this.options.indexOf("schema") !== -1)) {
            this.write(message);
        }
    }
    /**
     * Logs events from the migrations run process.
     */
    logMigration(message, queryRunner) {
        this.write(message);
    }
    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     */
    log(level, message, queryRunner) {
        switch (level) {
            case "log":
                if (this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("log") !== -1))
                    this.write("[LOG]: " + message);
                break;
            case "info":
                if (this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("info") !== -1))
                    this.write("[INFO]: " + message);
                break;
            case "warn":
                if (this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("warn") !== -1))
                    this.write("[WARN]: " + message);
                break;
        }
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Writes given strings into the log file.
     */
    write(strings) {
        strings = Array.isArray(strings) ? strings : [strings];
        const basePath = appRootPath.path + "/";
        let logPath = "ormlogs.log";
        if (this.fileLoggerOptions && this.fileLoggerOptions.logPath) {
            logPath = PlatformTools.pathNormalize(this.fileLoggerOptions.logPath);
        }
        strings = strings.map((str) => "[" + new Date().toISOString() + "]" + str);
        PlatformTools.appendFileSync(basePath + logPath, strings.join("\r\n") + "\r\n"); // todo: use async or implement promises?
    }
    /**
     * Converts parameters to a string.
     * Sometimes parameters can have circular objects and therefor we are handle this case too.
     */
    stringifyParams(parameters) {
        try {
            return JSON.stringify(parameters);
        }
        catch (error) {
            // most probably circular objects in parameters
            return parameters;
        }
    }
}

//# sourceMappingURL=FileLogger.js.map
