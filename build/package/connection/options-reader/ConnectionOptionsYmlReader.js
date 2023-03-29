"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionOptionsYmlReader = void 0;
var tslib_1 = require("tslib");
var js_yaml_1 = tslib_1.__importDefault(require("js-yaml"));
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
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var contentsBuffer, contents, config;
            return tslib_1.__generator(this, function (_a) {
                contentsBuffer = PlatformTools_1.PlatformTools.readFileSync(path);
                contents = contentsBuffer.toString();
                config = js_yaml_1.default.loadAll(contents);
                if (typeof config !== 'object') {
                    return [2 /*return*/, []];
                }
                return [2 /*return*/, Object.keys(config).map(function (connectionName) {
                        return Object.assign({ name: connectionName }, config[connectionName]);
                    })];
            });
        });
    };
    return ConnectionOptionsYmlReader;
}());
exports.ConnectionOptionsYmlReader = ConnectionOptionsYmlReader;

//# sourceMappingURL=ConnectionOptionsYmlReader.js.map
