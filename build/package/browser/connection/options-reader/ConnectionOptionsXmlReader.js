import { __awaiter, __generator } from "tslib";
import { parseString as xmlParser } from 'xml2js';
import { PlatformTools } from "../../platform/PlatformTools";
/**
 * Reads connection options defined in the xml file.
 */
var ConnectionOptionsXmlReader = /** @class */ (function () {
    function ConnectionOptionsXmlReader() {
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Reads connection options from given xml file.
     */
    ConnectionOptionsXmlReader.prototype.read = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var xml;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.readXml(path)];
                    case 1:
                        xml = _a.sent();
                        return [2 /*return*/, xml.connection.map(function (connection) {
                                return {
                                    name: connection.$.name,
                                    type: connection.$.type,
                                    url: connection.url ? connection.url[0] : undefined,
                                    host: connection.host ? connection.host[0] : undefined,
                                    port: connection.port && connection.port[0] ? parseInt(connection.port[0]) : undefined,
                                    username: connection.username ? connection.username[0] : undefined,
                                    password: connection.password ? connection.password[0] : undefined,
                                    database: connection.database ? connection.database[0] : undefined,
                                    sid: connection.sid ? connection.sid[0] : undefined,
                                    extra: connection.extra ? connection.extra[0] : undefined,
                                    synchronize: connection.synchronize ? connection.synchronize[0] : undefined,
                                    entities: connection.entities ? connection.entities[0].entity : [],
                                    subscribers: connection.subscribers ? connection.subscribers[0].entity : [],
                                    logging: connection.logging[0] ? connection.logging[0].split(",") : undefined,
                                };
                            })];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Reads xml file contents and returns them in a promise.
     */
    ConnectionOptionsXmlReader.prototype.readXml = function (path) {
        var xmlOptions = { trim: true, explicitRoot: false };
        return new Promise(function (ok, fail) {
            xmlParser(PlatformTools.readFileSync(path), xmlOptions, function (err, result) { return err ? fail(err) : ok(result); });
        });
    };
    return ConnectionOptionsXmlReader;
}());
export { ConnectionOptionsXmlReader };

//# sourceMappingURL=ConnectionOptionsXmlReader.js.map
