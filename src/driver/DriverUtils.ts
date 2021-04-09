import {Driver} from "./Driver";
import {hash,shorten} from "../util/StringUtils";

/**
 * Common driver utility functions.
 */
export class DriverUtils {

    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------

    /**
     * Normalizes and builds a new driver options.
     * Extracts settings from connection url and sets to a new options object.
     */
    static buildDriverOptions(options: any, buildOptions?: { useSid: boolean }): any {
        if (options.url) {
            const urlDriverOptions = this.parseConnectionUrl(options.url) as { [key: string]: any };

            if (buildOptions && buildOptions.useSid && urlDriverOptions.database) {
                urlDriverOptions.sid = urlDriverOptions.database;
            }

            for (const key of Object.keys(urlDriverOptions)) {
                if (typeof urlDriverOptions[key] === "undefined") {
                    delete urlDriverOptions[key];
                }
            }

            return Object.assign({}, options, urlDriverOptions);
        }
        return Object.assign({}, options);
    }

    /**
     * buildDriverOptions for MongodDB only to support replica set
     */
    static buildMongoDBDriverOptions(options: any, buildOptions?: { useSid: boolean }): any {
        if (options.url) {
            const urlDriverOptions = this.parseMongoDBConnectionUrl(options.url) as { [key: string]: any };

            if (buildOptions && buildOptions.useSid && urlDriverOptions.database) {
                urlDriverOptions.sid = urlDriverOptions.database;
            }

            for (const key of Object.keys(urlDriverOptions)) {
                if (typeof urlDriverOptions[key] === "undefined") {
                    delete urlDriverOptions[key];
                }
            }

            return Object.assign({}, options, urlDriverOptions);
        }
        return Object.assign({}, options);
    }


    /**
     * Joins and shortens alias if needed.
     *
     * If the alias length is greater than the limit allowed by the current
     * driver, replaces it with a shortend string, if the shortend string
     * is still too long, it will then hash the alias.
     *
     * @param driver Current `Driver`.
     * @param buildOptions Optional settings.
     * @param alias Alias parts.
     *
     * @return An alias that is no longer than the divers max alias length.
     */
     static buildAlias({ maxAliasLength }: Driver, buildOptions: { shorten?: boolean, joiner?: string } | string, ...alias: string[]): string {
        if (typeof buildOptions === "string") {
            alias.unshift(buildOptions);
            buildOptions = { shorten: false, joiner: "_" };
        } else {
            buildOptions = Object.assign({ shorten: false, joiner: "_" }, buildOptions);
        }

        const newAlias = alias.length === 1 ? alias[0] : alias.join(buildOptions.joiner);
        if (maxAliasLength && maxAliasLength > 0 && newAlias.length > maxAliasLength) {
            if (buildOptions.shorten === true) {
                const shortenedAlias = shorten(newAlias);
                if (shortenedAlias.length < maxAliasLength) {
                    return shortenedAlias;
                }
            }

            return hash(newAlias, { length: maxAliasLength });
        }

        return newAlias;
    }

    // -------------------------------------------------------------------------
    // Private Static Methods
    // -------------------------------------------------------------------------

    /**
     * Extracts connection data from the connection url.
     */
    private static parseConnectionUrl(url: string) {
        const type = url.split(":")[0];
        const firstSlashes = url.indexOf("//");
        const preBase = url.substr(firstSlashes + 2);
        const secondSlash = preBase.indexOf("/");
        const base = (secondSlash !== -1) ? preBase.substr(0, secondSlash) : preBase;
        let afterBase = (secondSlash !== -1) ? preBase.substr(secondSlash + 1) : undefined;
        // remove mongodb query params
        if (afterBase && afterBase.indexOf("?") !== -1) {
            afterBase = afterBase.substr(0, afterBase.indexOf("?"));
        }

        const lastAtSign = base.lastIndexOf("@");
        const usernameAndPassword = base.substr(0, lastAtSign);
        const hostAndPort = base.substr(lastAtSign + 1);

        let username = usernameAndPassword;
        let password = "";
        const firstColon = usernameAndPassword.indexOf(":");
        if (firstColon !== -1) {
            username = usernameAndPassword.substr(0, firstColon);
            password = usernameAndPassword.substr(firstColon + 1);
        }
        const [host, port] = hostAndPort.split(":");

        return {
            type: type,
            host: host,
            username: decodeURIComponent(username),
            password: decodeURIComponent(password),
            port: port ? parseInt(port) : undefined,
            database: afterBase || undefined
        };
    }

    /**
     * Extracts connection data from the connection url for MongoDB to support replica set.
     */
    private static parseMongoDBConnectionUrl(url: string) {
        const type = url.split(":")[0];
        const firstSlashes = url.indexOf("//");
        const preBase = url.substr(firstSlashes + 2);
        const secondSlash = preBase.indexOf("/");
        const base = (secondSlash !== -1) ? preBase.substr(0, secondSlash) : preBase;
        let afterBase = (secondSlash !== -1) ? preBase.substr(secondSlash + 1) : undefined;
        let afterQuestionMark = "";
        let host = undefined;
        let port = undefined;
        let hostReplicaSet = undefined;
        let replicaSet = undefined;
        // remove mongodb query params
        if (afterBase && afterBase.indexOf("?") !== -1) {
            // split params to get replica set
            afterQuestionMark = afterBase.substr((afterBase.indexOf("?") + 1), afterBase.length);
            replicaSet = afterQuestionMark.split("=")[1];

            afterBase = afterBase.substr(0, afterBase.indexOf("?"));
        }

        const lastAtSign = base.lastIndexOf("@");
        const usernameAndPassword = base.substr(0, lastAtSign);
        const hostAndPort = base.substr(lastAtSign + 1);

        let username = usernameAndPassword;
        let password = "";
        const firstColon = usernameAndPassword.indexOf(":");
        if (firstColon !== -1) {
            username = usernameAndPassword.substr(0, firstColon);
            password = usernameAndPassword.substr(firstColon + 1);
        }

        if (replicaSet) {
            hostReplicaSet = hostAndPort;
        } else {
            [host, port] = hostAndPort.split(":");
        }

        return {
            type: type,
            host: host,
            hostReplicaSet: hostReplicaSet,
            username: decodeURIComponent(username),
            password: decodeURIComponent(password),
            port: port ? parseInt(port) : undefined,
            database: afterBase || undefined,
            replicaSet: replicaSet || undefined
        };
    }
}
