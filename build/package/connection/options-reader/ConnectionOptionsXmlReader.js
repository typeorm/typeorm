"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionOptionsXmlReader = void 0;
const xml2js_1 = require("xml2js");
const PlatformTools_1 = require("../../platform/PlatformTools");
/**
 * Reads connection options defined in the xml file.
 *
 * @deprecated
 */
class ConnectionOptionsXmlReader {
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Reads connection options from given xml file.
     */
    async read(path) {
        const xml = await this.readXml(path);
        return xml.connection.map((connection) => {
            return {
                name: connection.$.name,
                type: connection.$.type,
                url: connection.url ? connection.url[0] : undefined,
                host: connection.host ? connection.host[0] : undefined,
                port: connection.port && connection.port[0]
                    ? parseInt(connection.port[0])
                    : undefined,
                username: connection.username
                    ? connection.username[0]
                    : undefined,
                password: connection.password
                    ? connection.password[0]
                    : undefined,
                database: connection.database
                    ? connection.database[0]
                    : undefined,
                sid: connection.sid ? connection.sid[0] : undefined,
                extra: connection.extra ? connection.extra[0] : undefined,
                synchronize: connection.synchronize
                    ? connection.synchronize[0]
                    : undefined,
                entities: connection.entities
                    ? connection.entities[0].entity
                    : [],
                subscribers: connection.subscribers
                    ? connection.subscribers[0].entity
                    : [],
                logging: connection.logging[0]
                    ? connection.logging[0].split(",")
                    : undefined,
            };
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
            (0, xml2js_1.parseString)(PlatformTools_1.PlatformTools.readFileSync(path), xmlOptions, (err, result) => (err ? fail(err) : ok(result)));
        });
    }
}
exports.ConnectionOptionsXmlReader = ConnectionOptionsXmlReader;

//# sourceMappingURL=ConnectionOptionsXmlReader.js.map
