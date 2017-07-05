import * as fs from "fs";
import {PlatformTools} from "../../platform/PlatformTools";
import {ConnectionOptions} from "../ConnectionOptions";

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
    async read(path: string): Promise<ConnectionOptions[]> {
        const xml = await this.readXml(path);
        return (xml.connection as any[]).map(connection => {
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
                autoSchemaSync: connection.autoSchemaSync ? connection.autoSchemaSync[0] : undefined,
                entities: connection.entities ? connection.entities[0].entity : [],
                subscribers: connection.subscribers ? connection.subscribers[0].entity : [],
                entitySchemas: connection.entitySchemas ? connection.entitySchemas[0].entity : [],
                logging: {
                    logQueries: connection.logging && connection.logging[0].logQueries ? connection.logging[0].logQueries[0] : undefined,
                    logFailedQueryError: connection.logging && connection.logging[0].logFailedQueryError ? connection.logging[0].logFailedQueryError[0] : undefined,
                    logOnlyFailedQueries: connection.logging && connection.logging[0].logOnlyFailedQueries ? connection.logging[0].logOnlyFailedQueries[0] : undefined,
                }
            };
        });
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Reads xml file contents and returns them in a promise.
     */
    protected readXml(path: string): Promise<any> {
        const xmlParser = PlatformTools.load("xml2js").parseString;
        const xmlOptions = { trim: true, explicitRoot: false };
        return new Promise((ok, fail) => {
            xmlParser(fs.readFileSync(path), xmlOptions, (err: any, result: any) => err ? fail(err) : ok(result));
        });
    }

}