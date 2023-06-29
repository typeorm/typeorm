import { __awaiter } from "tslib";
import { parseString as xmlParser } from 'xml2js';
import { PlatformTools } from "../../platform/PlatformTools";
/**
 * Reads connection options defined in the xml file.
 */
export class ConnectionOptionsXmlReader {
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Reads connection options from given xml file.
     */
    read(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const xml = yield this.readXml(path);
            return xml.connection.map(connection => {
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
            });
        });
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Reads xml file contents and returns them in a promise.
     */
    readXml(path) {
        const xmlOptions = { trim: true, explicitRoot: false };
        return new Promise((ok, fail) => {
            xmlParser(PlatformTools.readFileSync(path), xmlOptions, (err, result) => err ? fail(err) : ok(result));
        });
    }
}

//# sourceMappingURL=ConnectionOptionsXmlReader.js.map
