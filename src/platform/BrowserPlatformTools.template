/**
 * Browser's implementation of the platform-specific tools.
 *
 * This file gonna replace PlatformTools for browser environment.
 * For node.js environment this class is not getting packaged.
 * Don't use methods of this class in the code, use PlatformTools methods instead.
 */
export class PlatformTools {

    /**
     * Type of the currently running platform.
     */
    static type: "browser"|"node" = "browser";

    /**
     * Gets global variable where global stuff can be stored.
     */
    static getGlobalVariable(): any {
        return window;
    }

    /**
     * Loads ("require"-s) given file or package.
     * This operation only supports on node platform
     */
    static load(name: string): any {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: require("${name}").`);

        return "";
    }

    /**
     * Normalizes given path. Does "path.normalize".
     */
    static pathNormalize(pathStr: string): string {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: path.normalize("${pathStr}").`);

        return "";
    }

    /**
     * Gets file extension. Does "path.extname".
     */
    static pathExtname(pathStr: string): string {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: path.extname("${pathStr}").`);

        return "";
    }

    /**
     * Resolved given path. Does "path.resolve".
     */
    static pathResolve(pathStr: string): string {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: path.resolve("${pathStr}").`);

        return "";
    }

    /**
     * Synchronously checks if file exist. Does "fs.existsSync".
     */
    static fileExist(pathStr: string): boolean {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: fs.existsSync("${pathStr}").`);

        return false;
    }

    /**
     * Gets environment variable.
     */
    static getEnvVariable(name: string): any {
        // if (this.type === "browser")
        //     throw new Error(`This option/function is not supported in the browser environment. Failed operation: process.env["${name}"].`);
        return undefined;
    }

    static readFileSync(filename: string): any {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: fs.readFileSync("${filename}").`);
        return null;
    }
    
    static appendFileSync(filename: string, data: any) {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: fs.appendFileSync("${filename}").`);
    }

    static writeFile(path: string, data: any): Promise<void> {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: fs.writeFile("${path}").`);
        return Promise.reject(null);
    }

    /**
     * Highlights sql string to be print in the console.
     */
    static highlightSql(sql: string) {
        return sql;
    }

    /**
     * Highlights json string to be print in the console.
     */
    static highlightJson(json: string) {
        return json;
    }

    /**
     * Logging functions needed by AdvancedConsoleLogger (but here without chalk)
     */
    static logInfo(prefix: string, info: any) {
        console.info(prefix + " ", info);
    }

    static logError(prefix: string, error: any) {
        console.error(prefix + " ", error);
    }
    
    static logWarn(prefix: string, warning: any) {
        console.warn(prefix + " ", warning);
    }
    
    static log(message: string) {
        console.log(message);
    }

    static warn(message: string) {
        return message;
    }
}

/**
 * These classes are needed for stream operations or
 * in the mongodb driver. both aren't supported in the browser
 */
export class EventEmitter {}

export class Readable {}

export class Writable {}

export interface ReadStream {}