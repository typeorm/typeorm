import { __awaiter } from "tslib";
import ymlParser from 'js-yaml';
import { PlatformTools } from "../../platform/PlatformTools";
/**
 * Reads connection options defined in the yml file.
 */
export class ConnectionOptionsYmlReader {
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Reads connection options from given yml file.
     */
    read(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const contentsBuffer = PlatformTools.readFileSync(path);
            const contents = contentsBuffer.toString();
            const config = ymlParser.loadAll(contents);
            if (typeof config !== 'object') {
                return [];
            }
            return Object.keys(config).map(connectionName => {
                return Object.assign({ name: connectionName }, config[connectionName]);
            });
        });
    }
}

//# sourceMappingURL=ConnectionOptionsYmlReader.js.map
