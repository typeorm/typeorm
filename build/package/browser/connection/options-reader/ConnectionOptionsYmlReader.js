import { __awaiter, __generator } from "tslib";
import ymlParser from 'js-yaml';
import { PlatformTools } from "../../platform/PlatformTools";
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
        return __awaiter(this, void 0, void 0, function () {
            var contentsBuffer, contents, config;
            return __generator(this, function (_a) {
                contentsBuffer = PlatformTools.readFileSync(path);
                contents = contentsBuffer.toString();
                config = ymlParser.loadAll(contents);
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
export { ConnectionOptionsYmlReader };

//# sourceMappingURL=ConnectionOptionsYmlReader.js.map
