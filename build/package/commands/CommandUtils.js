"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandUtils = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const mkdirp_1 = tslib_1.__importDefault(require("mkdirp"));
/**
 * Command line utils functions.
 */
class CommandUtils {
    /**
     * Creates directories recursively.
     */
    static createDirectories(directory) {
        return (0, mkdirp_1.default)(directory);
    }
    /**
     * Creates a file with the given content in the given path.
     */
    static createFile(filePath, content, override = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield CommandUtils.createDirectories(path.dirname(filePath));
            return new Promise((ok, fail) => {
                if (override === false && fs.existsSync(filePath))
                    return ok();
                fs.writeFile(filePath, content, err => err ? fail(err) : ok());
            });
        });
    }
    /**
     * Reads everything from a given file and returns its content as a string.
     */
    static readFile(filePath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return new Promise((ok, fail) => {
                fs.readFile(filePath, (err, data) => err ? fail(err) : ok(data.toString()));
            });
        });
    }
    static fileExists(filePath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return fs.existsSync(filePath);
        });
    }
}
exports.CommandUtils = CommandUtils;

//# sourceMappingURL=CommandUtils.js.map
