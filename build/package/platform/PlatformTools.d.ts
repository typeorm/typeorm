
export { ReadStream } from "fs";
export { EventEmitter } from "events";
export { Readable, Writable } from "stream";
/**
 * Platform-specific tools.
 */
export declare class PlatformTools {
    /**
     * Type of the currently running platform.
     */
    static type: "browser" | "node";
    /**
     * Gets global variable where global stuff can be stored.
     */
    static getGlobalVariable(): any;
    /**
     * Loads ("require"-s) given file or package.
     * This operation only supports on node platform
     */
    static load(name: string): any;
    /**
     * Normalizes given path. Does "path.normalize".
     */
    static pathNormalize(pathStr: string): string;
    /**
     * Gets file extension. Does "path.extname".
     */
    static pathExtname(pathStr: string): string;
    /**
     * Resolved given path. Does "path.resolve".
     */
    static pathResolve(pathStr: string): string;
    /**
     * Synchronously checks if file exist. Does "fs.existsSync".
     */
    static fileExist(pathStr: string): boolean;
    static readFileSync(filename: string): Buffer;
    static appendFileSync(filename: string, data: any): void;
    static writeFile(path: string, data: any): Promise<void>;
    /**
     * Loads a dotenv file into the environment variables.
     *
     * @param path The file to load as a dotenv configuration
     */
    static dotenv(pathStr: string): void;
    /**
     * Gets environment variable.
     */
    static getEnvVariable(name: string): any;
    /**
     * Highlights sql string to be print in the console.
     */
    static highlightSql(sql: string): string;
    /**
     * Highlights json string to be print in the console.
     */
    static highlightJson(json: string): string;
    /**
     * Logging functions needed by AdvancedConsoleLogger
     */
    static logInfo(prefix: string, info: any): void;
    static logError(prefix: string, error: any): void;
    static logWarn(prefix: string, warning: any): void;
    static log(message: string): void;
    static warn(message: string): string;
    static logCmdErr(prefix: string, err?: any): void;
}
