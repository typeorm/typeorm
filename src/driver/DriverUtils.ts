import {DriverOptions} from "./DriverOptions";

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
    static buildDriverOptions(options: DriverOptions, buildOptions?: { useSid: boolean }): DriverOptions {
        if (options.url) {
            const parsedUrl = this.parseConnectionUrl(options.url);
            if (buildOptions && buildOptions.useSid) {
                const urlDriverOptions: DriverOptions = {
                    type: options.type,
                    host: parsedUrl.host,
                    username: parsedUrl.username,
                    password: parsedUrl.password,
                    port: parsedUrl.port,
                    sid: parsedUrl.database,
                    domain: parsedUrl.domain
                };
                return Object.assign(urlDriverOptions, options);

            } else {
                const urlDriverOptions: DriverOptions = {
                    type: options.type,
                    host: parsedUrl.host,
                    username: parsedUrl.username,
                    password: parsedUrl.password,
                    port: parsedUrl.port,
                    database: parsedUrl.database,
                    domain: parsedUrl.domain
                };
                return Object.assign(urlDriverOptions, options);
            }
        }
        return Object.assign({}, options);
    }

    // -------------------------------------------------------------------------
    // Private Static Methods
    // -------------------------------------------------------------------------

    /**
     * Extracts connection data from the connection url.
     */
    private static parseConnectionUrl(url: string) {
        const firstSlashes = url.indexOf("//");
        const preBase = url.substr(firstSlashes + 2);
        const secondSlash = preBase.indexOf("/");
        const base = (secondSlash !== -1) ? preBase.substr(0, secondSlash) : preBase;
        const afterBase = (secondSlash !== -1) ? preBase.substr(secondSlash + 1) : undefined;
        const [usernameAndPassword, hostAndPort] = base.split("@");
        const [usernameAndDomain, password] = usernameAndPassword.split(":"); // could be domain/username:password for MSSQL users with AD
        const [domain, username] = usernameAndDomain.split("/"); // splits domain/username
        const [host, port] = hostAndPort.split(":");

        return {
            host: host,
            username: username,
            password: password,
            port: port ? parseInt(port) : undefined,
            database: afterBase || undefined,
            domain: domain || undefined
        };
    }

}
