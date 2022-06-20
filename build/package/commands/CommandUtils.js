"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandUtils = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const mkdirp_1 = tslib_1.__importDefault(require("mkdirp"));
const error_1 = require("../error");
const InstanceChecker_1 = require("../util/InstanceChecker");
const ImportUtils_1 = require("../util/ImportUtils");
/**
 * Command line utils functions.
 */
class CommandUtils {
    static async loadDataSource(dataSourceFilePath) {
        let dataSourceFileExports;
        try {
            ;
            [dataSourceFileExports] = await (0, ImportUtils_1.importOrRequireFile)(dataSourceFilePath);
        }
        catch (err) {
            throw new Error(`Unable to open file: "${dataSourceFilePath}". ${err.message}`);
        }
        if (!dataSourceFileExports ||
            typeof dataSourceFileExports !== "object") {
            throw new Error(`Given data source file must contain export of a DataSource instance`);
        }
        const dataSourceExports = [];
        for (let fileExport in dataSourceFileExports) {
            if (InstanceChecker_1.InstanceChecker.isDataSource(dataSourceFileExports[fileExport])) {
                dataSourceExports.push(dataSourceFileExports[fileExport]);
            }
        }
        if (dataSourceExports.length === 0) {
            throw new Error(`Given data source file must contain export of a DataSource instance`);
        }
        if (dataSourceExports.length > 1) {
            throw new Error(`Given data source file must contain only one export of DataSource instance`);
        }
        return dataSourceExports[0];
    }
    /**
     * Creates directories recursively.
     */
    static createDirectories(directory) {
        return (0, mkdirp_1.default)(directory);
    }
    /**
     * Creates a file with the given content in the given path.
     */
    static async createFile(filePath, content, override = true) {
        await CommandUtils.createDirectories(path.dirname(filePath));
        return new Promise((ok, fail) => {
            if (override === false && fs.existsSync(filePath))
                return ok();
            fs.writeFile(filePath, content, (err) => (err ? fail(err) : ok()));
        });
    }
    /**
     * Reads everything from a given file and returns its content as a string.
     */
    static async readFile(filePath) {
        return new Promise((ok, fail) => {
            fs.readFile(filePath, (err, data) => err ? fail(err) : ok(data.toString()));
        });
    }
    static async fileExists(filePath) {
        return fs.existsSync(filePath);
    }
    /**
     * Gets migration timestamp and validates argument (if sent)
     */
    static getTimestamp(timestampOptionArgument) {
        if (timestampOptionArgument &&
            (isNaN(timestampOptionArgument) || timestampOptionArgument < 0)) {
            throw new error_1.TypeORMError(`timestamp option should be a non-negative number. received: ${timestampOptionArgument}`);
        }
        return timestampOptionArgument
            ? new Date(Number(timestampOptionArgument)).getTime()
            : Date.now();
    }
}
exports.CommandUtils = CommandUtils;

//# sourceMappingURL=CommandUtils.js.map
