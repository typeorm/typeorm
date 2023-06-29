import { hash } from "../util/StringUtils";
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
    static buildDriverOptions(options, buildOptions) {
        if (options.url) {
            const urlDriverOptions = this.parseConnectionUrl(options.url);
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
    static buildMongoDBDriverOptions(options, buildOptions) {
        if (options.url) {
            const urlDriverOptions = this.parseMongoDBConnectionUrl(options.url);
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
     * Builds column alias from given alias name and column name.
     *
     * If alias length is greater than the limit (if any) allowed by the current
     * driver, replaces it with a hashed string.
     *
     * @param driver Current `Driver`.
     * @param alias Alias part.
     * @param column Name of the column to be concatened to `alias`.
     *
     * @return An alias allowing to select/transform the target `column`.
     */
    static buildColumnAlias({ maxAliasLength }, alias, column) {
        const columnAliasName = alias + "_" + column;
        if (maxAliasLength && maxAliasLength > 0 && columnAliasName.length > maxAliasLength) {
            return hash(columnAliasName, { length: maxAliasLength });
        }
        return columnAliasName;
    }
    // -------------------------------------------------------------------------
    // Private Static Methods
    // -------------------------------------------------------------------------
    /**
     * Extracts connection data from the connection url.
     */
    static parseConnectionUrl(url) {
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
    static parseMongoDBConnectionUrl(url) {
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
        }
        else {
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

//# sourceMappingURL=DriverUtils.js.map
