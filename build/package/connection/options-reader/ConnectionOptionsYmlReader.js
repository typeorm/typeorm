"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionOptionsYmlReader = void 0;
const tslib_1 = require("tslib");
const js_yaml_1 = tslib_1.__importDefault(require("js-yaml"));
const PlatformTools_1 = require("../../platform/PlatformTools");
/**
 * Reads connection options defined in the yml file.
 */
class ConnectionOptionsYmlReader {
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Reads connection options from given yml file.
     */
    read(path) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const contentsBuffer = PlatformTools_1.PlatformTools.readFileSync(path);
            const contents = contentsBuffer.toString();
            const config = js_yaml_1.default.loadAll(contents);
            if (typeof config !== 'object') {
                return [];
            }
            return Object.keys(config).map(connectionName => {
                return Object.assign({ name: connectionName }, config[connectionName]);
            });
        });
    }
}
exports.ConnectionOptionsYmlReader = ConnectionOptionsYmlReader;

//# sourceMappingURL=ConnectionOptionsYmlReader.js.map
