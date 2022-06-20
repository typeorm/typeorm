/**
 * Browser's implementation of the platform-specific tools.
 *
 * This file gonna replace PlatformTools for browser environment.
 * For node.js environment this class is not getting packaged.
 * Don't use methods of this class in the code, use PlatformTools methods instead.
 */
export class PlatformTools {
    /**
     * Gets global variable where global stuff can be stored.
     */
    static getGlobalVariable() {
        if (typeof window !== "undefined") {
            return window;
        }
        else {
            // NativeScript uses global, not window
            return global;
        }
    }
    /**
     * Loads ("require"-s) given file or package.
     * This operation only supports on node platform
     */
    static load(name) {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: require("${name}").`);
        return "";
    }
    /**
     * Normalizes given path. Does "path.normalize".
     */
    static pathNormalize(pathStr) {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: path.normalize("${pathStr}").`);
        return "";
    }
    /**
     * Gets file extension. Does "path.extname".
     */
    static pathExtname(pathStr) {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: path.extname("${pathStr}").`);
        return "";
    }
    /**
     * Resolved given path. Does "path.resolve".
     */
    static pathResolve(pathStr) {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: path.resolve("${pathStr}").`);
        return "";
    }
    /**
     * Synchronously checks if file exist. Does "fs.existsSync".
     */
    static fileExist(pathStr) {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: fs.existsSync("${pathStr}").`);
        return false;
    }
    static dotenv(pathStr) {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: dotenv.config({ path: "${pathStr}" }).`);
    }
    /**
     * Gets environment variable.
     */
    static getEnvVariable(name) {
        // if (this.type === "browser")
        //     throw new Error(`This option/function is not supported in the browser environment. Failed operation: process.env["${name}"].`);
        return undefined;
    }
    static readFileSync(filename) {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: fs.readFileSync("${filename}").`);
        return null;
    }
    static appendFileSync(filename, data) {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: fs.appendFileSync("${filename}").`);
    }
    static writeFile(path, data) {
        if (this.type === "browser")
            throw new Error(`This option/function is not supported in the browser environment. Failed operation: fs.writeFile("${path}").`);
        return Promise.reject(null);
    }
    /**
     * Highlights sql string to be print in the console.
     */
    static highlightSql(sql) {
        return sql;
    }
    /**
     * Highlights json string to be print in the console.
     */
    static highlightJson(json) {
        return json;
    }
    /**
     * Logging functions needed by AdvancedConsoleLogger (but here without chalk)
     */
    static logInfo(prefix, info) {
        console.info(prefix + " ", info);
    }
    static logError(prefix, error) {
        console.error(prefix + " ", error);
    }
    static logWarn(prefix, warning) {
        console.warn(prefix + " ", warning);
    }
    static log(message) {
        console.log(message);
    }
    static warn(message) {
        return message;
    }
}
/**
 * Type of the currently running platform.
 */
PlatformTools.type = "browser";
/**
 * These classes are needed for stream operations or
 * in the mongodb driver. Both aren't supported in the browser.
 */
export class EventEmitter {
}
export class Readable {
}
export class Writable {
}
if (typeof window !== "undefined") {
    window.Buffer = require("buffer/").Buffer;
}
// NativeScript uses global, not window
if (typeof global !== "undefined") {
    global.Buffer = require("buffer/").Buffer;
}

//# sourceMappingURL=BrowserPlatformTools.js.map
