"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PlatformTools_1 = require("../../platform/PlatformTools");
/**
 * Reads connection options defined in the yml file.
 */
var ConnectionOptionsYmlReader = /** @class */ (function () {
    function ConnectionOptionsYmlReader() {
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Reads connection options from given yml file.
     */
    ConnectionOptionsYmlReader.prototype.read = function (path) {
        var ymlParser = PlatformTools_1.PlatformTools.load("js-yaml");
        var config = ymlParser.safeLoad(PlatformTools_1.PlatformTools.readFileSync(path));
        return Object.keys(config).map(function (connectionName) {
            return Object.assign({ name: connectionName }, config[connectionName]);
        });
    };
    return ConnectionOptionsYmlReader;
}());
exports.ConnectionOptionsYmlReader = ConnectionOptionsYmlReader;
//# sourceMappingURL=ConnectionOptionsYmlReader.js.map