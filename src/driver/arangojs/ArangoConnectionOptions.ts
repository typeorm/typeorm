import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

/**
 * Arangodb specific connection options.
 * https://www.arangodb.com/docs/stable/drivers/js-reference-database.html
 */
export interface ArangoConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "arangojs";
    /**
     * ### database.useDatabase(databaseName): this
     * Updates the Database instance and its connection string to use the given databaseName, then returns itself.
     * **Note**: This method can not be used when the arangojs instance was created with isAbsolute: true.
     */
    readonly database?: string
    /**
     * Database username. Defaults to "root"
     */
    readonly username?: string;
    /**
     * Database password. Defaults to ""
     */
    readonly password?: string;
    /**
     * Authorization header to use Bearer authentication
     */
    readonly token?: string
    /**
     * ### url: string | Array<string> (Default: http://localhost:8529)
     * Base URL of the ArangoDB server or list of server URLs.
     * 
     * When working with a cluster or a single server with leader/follower failover, the method db.acquireHostList can be used to automatically pick up additional Coordinators/followers at any point.
     * 
     * When running ArangoDB on a unix socket, e.g. /tmp/arangodb.sock, the following URL formats are supported for unix sockets:
     * * unix:///tmp/arangodb.sock (no SSL)
     * * http+unix:///tmp/arangodb.sock (or https+unix:// for SSL)
     * * http://unix:/tmp/arangodb.sock (or https://unix: for SSL)
     * 
     * Additionally ssl and tls are treated as synonymous with https and tcp is treated as synonymous with http, so the following URLs are considered identical:
     * * tcp://localhost:8529 and http://localhost:8529
     * * ssl://localhost:8529 and https://localhost:8529
     * * tcp+unix:///tmp/arangodb.sock and http+unix:///tmp/arangodb.sock
     * * ssl+unix:///tmp/arangodb.sock and https+unix:///tmp/arangodb.sock
     * * tcp://unix:/tmp/arangodb.sock and http://unix:/tmp/arangodb.sock
     * * ssl://unix:/tmp/arangodb.sock and https://unix:/tmp/arangodb.sock
     * If you want to use ArangoDB with authentication, see useBasicAuth or useBearerAuth methods.
     * If you need to support self-signed HTTPS certificates, you may have to add your certificates to the agentOptions, e.g.:
     * ```js
     * agentOptions: {
     *  ca: [
     *      fs.readFileSync(".ssl/sub.class1.server.ca.pem"),
     *      fs.readFileSync(".ssl/ca.pem")
     *  ]
     * }
     * ```
     * Although this is strongly discouraged, it’s also possible to disable HTTPS certificate validation entirely, but note this has extremely dangerous security implications:
     * ```js
     * agentOptions: {
     *  rejectUnauthorized: false
     * }
     * ```
     */
    readonly url?: string;

    /**
     * ### isAbsolute: boolean (Default: false)
     * If this option is explicitly set to true, the url will be treated as the absolute database path and arangojs will not append the database path to it.
     * Note: This makes it impossible to switch databases with useDatabase or using acquireHostList. This is only intended to be used as an escape hatch when working with standalone servers exposing a single database API from behind a reverse proxy, which is not a recommended setup.
     */
    readonly isAbsolute?: boolean;

    /**
     * ### arangoVersion: number (Default: 30000)
     * Numeric representation of the ArangoDB version the driver should expect. The format is defined as XYYZZ where X is the major version, Y is the zero-filled two-digit minor version and Z is the zero-filled two-digit bugfix version, e.g. 30102 for 3.1.2, 20811 for 2.8.11.
     * Depending on this value certain methods may become unavailable or change their behavior to remain compatible with different versions of ArangoDB.
     */
    readonly arangoVersion?: number;

    /**
     * ### headers: Object (optional)
     * An object with additional headers to send with every request.
     * Header names should always be lowercase. If an "authorization" header is provided, it will be overridden when using useBasicAuth or useBearerAuth
     */
    readonly headers?: any;

    /**
     * ### agent: Agent (optional)
     * An http Agent instance to use for connections.
     * By default a new [http.Agent](https://nodejs.org/api/http.html#http_new_agent_options) (or https.Agent) instance will be created using the agentOptions.
     * This option has no effect when using the browser version of arangojs.
     */
    readonly agent?: any;

    /**
     * ### agentOptions: Object (Default: see below)
     * An object with options for the agent. This will be ignored if agent is also provided.
     * Default: {maxSockets: 3, keepAlive: true, keepAliveMsecs: 1000}. Browser default: {maxSockets: 3, keepAlive: false};
     * The option maxSockets can also be used to limit how many requests arangojs will perform concurrently. The maximum number of requests is equal to maxSockets * 2 with keepAlive: true or equal to maxSockets with keepAlive: false.
     * In the browser version of arangojs this option can be used to pass additional options to the underlying calls of the [xhr](https://www.npmjs.com/package/xhr) module.
     */
    readonly agentOptions?: any;

    /**
     * ### loadBalancingStrategy: string (Default: "NONE")
     * Determines the behavior when multiple URLs are provided:
     * * NONE: No load balancing. All requests will be handled by the first URL in the list until a network error is encountered. On network error, arangojs will advance to using the next URL in the list.
     * * ONE_RANDOM: Randomly picks one URL from the list initially, then behaves like NONE.
     * * ROUND_ROBIN: Every sequential request uses the next URL in the list.
     */
    readonly loadBalancingStrategy?: 'NONE' | 'ONE_RANDOM' | 'ROUND_ROBIN';

    /**
     * ### maxRetries: number or false (Default: 0)
     * Determines the behavior when a request fails because the underlying connection to the server could not be opened (i.e. [ECONNREFUSED in Node.js](https://nodejs.org/api/errors.html#errors_common_system_errors)):
     * * false: the request fails immediately.
     * * 0: the request is retried until a server can be reached but only a total number of times matching the number of known servers (including the initial failed request).
     * * any other number: the request is retried until a server can be reached the request has been retried a total of maxRetries number of times (not including the initial failed request).
     * 
     * When working with a single server without leader/follower failover, the retries (if any) will be made to the same server.
     * This setting currently has no effect when using arangojs in a browser.
     * **Note**: Requests bound to a specific server (e.g. fetching query results) will never be retried automatically and ignore this setting.
     */
    readonly maxRetries?: number | false;
}
