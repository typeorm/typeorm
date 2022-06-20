"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionOptionsYmlReader = void 0;
const tslib_1 = require("tslib");
const js_yaml_1 = tslib_1.__importDefault(require("js-yaml"));
const PlatformTools_1 = require("../../platform/PlatformTools");
/**
 * Reads connection options defined in the yml file.
 *
 * @deprecated
 */
class ConnectionOptionsYmlReader {
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Reads connection options from given yml file.
     */
    async read(path) {
        const contentsBuffer = PlatformTools_1.PlatformTools.readFileSync(path);
        const contents = contentsBuffer.toString();
        const config = js_yaml_1.default.load(contents);
        if (!config || typeof config !== "object" || config === null) {
            return [];
        }
        return Object.keys(config).map((connectionName) => {
            return Object.assign({ name: connectionName }, config[connectionName]);
        });
    }
}
exports.ConnectionOptionsYmlReader = ConnectionOptionsYmlReader;

//# sourceMappingURL=ConnectionOptionsYmlReader.js.map
