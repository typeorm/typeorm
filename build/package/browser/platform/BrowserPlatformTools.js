/**
 * Browser's implementation of the platform-specific tools.
 *
 * This file gonna replace PlatformTools for browser environment.
 * For node.js environment this class is not getting packaged.
 * Don't use methods of this class in the code, use PlatformTools methods instead.
 */
var PlatformTools = /** @class */ (function () {
    function PlatformTools() {
    }
    /**
     * Gets global variable where global stuff can be stored.
     */
    PlatformTools.getGlobalVariable = function () {
        if (typeof window !== "undefined") {
            return window;
        }
        else {
            // NativeScript uses global, not window
            return global;
        }
    };
    /**
     * Loads ("require"-s) given file or package.
     * This operation only supports on node platform
     */
    PlatformTools.load = function (name) {
        if (this.type === "browser")
            throw new Error("This option/function is not supported in the browser environment. Failed operation: require(\"" + name + "\").");
        return "";
    };
    /**
     * Normalizes given path. Does "path.normalize".
     */
    PlatformTools.pathNormalize = function (pathStr) {
        if (this.type === "browser")
            throw new Error("This option/function is not supported in the browser environment. Failed operation: path.normalize(\"" + pathStr + "\").");
        return "";
    };
    /**
     * Gets file extension. Does "path.extname".
     */
    PlatformTools.pathExtname = function (pathStr) {
        if (this.type === "browser")
            throw new Error("This option/function is not supported in the browser environment. Failed operation: path.extname(\"" + pathStr + "\").");
        return "";
    };
    /**
     * Resolved given path. Does "path.resolve".
     */
    PlatformTools.pathResolve = function (pathStr) {
        if (this.type === "browser")
            throw new Error("This option/function is not supported in the browser environment. Failed operation: path.resolve(\"" + pathStr + "\").");
        return "";
    };
    /**
     * Synchronously checks if file exist. Does "fs.existsSync".
     */
    PlatformTools.fileExist = function (pathStr) {
        if (this.type === "browser")
            throw new Error("This option/function is not supported in the browser environment. Failed operation: fs.existsSync(\"" + pathStr + "\").");
        return false;
    };
    PlatformTools.dotenv = function (pathStr) {
        if (this.type === "browser")
            throw new Error("This option/function is not supported in the browser environment. Failed operation: dotenv.config({ path: \"" + pathStr + "\" }).");
    };
    /**
     * Gets environment variable.
     */
    PlatformTools.getEnvVariable = function (name) {
        // if (this.type === "browser")
        //     throw new Error(`This option/function is not supported in the browser environment. Failed operation: process.env["${name}"].`);
        return undefined;
    };
    PlatformTools.readFileSync = function (filename) {
        if (this.type === "browser")
            throw new Error("This option/function is not supported in the browser environment. Failed operation: fs.readFileSync(\"" + filename + "\").");
        return null;
    };
    PlatformTools.appendFileSync = function (filename, data) {
        if (this.type === "browser")
            throw new Error("This option/function is not supported in the browser environment. Failed operation: fs.appendFileSync(\"" + filename + "\").");
    };
    PlatformTools.writeFile = function (path, data) {
        if (this.type === "browser")
            throw new Error("This option/function is not supported in the browser environment. Failed operation: fs.writeFile(\"" + path + "\").");
        return Promise.reject(null);
    };
    /**
     * Highlights sql string to be print in the console.
     */
    PlatformTools.highlightSql = function (sql) {
        return sql;
    };
    /**
     * Highlights json string to be print in the console.
     */
    PlatformTools.highlightJson = function (json) {
        return json;
    };
    /**
     * Logging functions needed by AdvancedConsoleLogger (but here without chalk)
     */
    PlatformTools.logInfo = function (prefix, info) {
        console.info(prefix + " ", info);
    };
    PlatformTools.logError = function (prefix, error) {
        console.error(prefix + " ", error);
    };
    PlatformTools.logWarn = function (prefix, warning) {
        console.warn(prefix + " ", warning);
    };
    PlatformTools.log = function (message) {
        console.log(message);
    };
    PlatformTools.warn = function (message) {
        return message;
    };
    /**
     * Type of the currently running platform.
     */
    PlatformTools.type = "browser";
    return PlatformTools;
}());
export { PlatformTools };
/**
 * These classes are needed for stream operations or
 * in the mongodb driver. Both aren't supported in the browser.
 */
var EventEmitter = /** @class */ (function () {
    function EventEmitter() {
    }
    return EventEmitter;
}());
export { EventEmitter };
var Readable = /** @class */ (function () {
    function Readable() {
    }
    return Readable;
}());
export { Readable };
var Writable = /** @class */ (function () {
    function Writable() {
    }
    return Writable;
}());
export { Writable };
if (typeof window !== "undefined") {
    window.Buffer = require("buffer/").Buffer;
}
// NativeScript uses global, not window
if (typeof global !== "undefined") {
    global.Buffer = require("buffer/").Buffer;
}

//# sourceMappingURL=BrowserPlatformTools.js.map
