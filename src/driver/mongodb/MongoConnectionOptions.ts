import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";
import {ReadPreference} from "./typings";

/**
 * MongoDB specific connection options.
 */
export interface MongoConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "mongodb";

    /**
     * Connection url where perform connection to.
     */
    readonly url?: string;

    /**
     * Database host.
     */
    readonly host?: string;

    /**
     * Database host port.
     */
    readonly port?: number;

    /**
     * Database username.
     */
    readonly username?: string;
    
    /**
     * Database password.
     */
    readonly password?: string;

    /**
     * Database name to connect to.
     */
    readonly database?: string;

    /**
     * Set the maximum poolSize for each individual server or proxy connection.
     */
    readonly poolSize?: number;

    /**
     * Use ssl connection (needs to have a mongod server with ssl support). Default: false
     */
    readonly ssl?: boolean;

    /**
     * Validate mongod server certificate against ca (needs to have a mongod server with ssl support, 2.4 or higher).
     * Default: true
     */
    readonly sslValidate?: boolean;

    /**
     * Array of valid certificates either as Buffers or Strings
     * (needs to have a mongod server with ssl support, 2.4 or higher).
     */
    readonly sslCA?: string[]|Buffer[];

    /**
     * String or buffer containing the certificate we wish to present
     * (needs to have a mongod server with ssl support, 2.4 or higher)
     */
    readonly sslCert?: string|Buffer;

    /**
     * String or buffer containing the certificate private key we wish to present
     * (needs to have a mongod server with ssl support, 2.4 or higher)
     */
    readonly sslKey?: string|Buffer;

    /**
     * String or buffer containing the certificate password
     * (needs to have a mongod server with ssl support, 2.4 or higher)
     */
    readonly sslPass?: string|Buffer;

    /**
     * Reconnect on error. Default: true
     */
    readonly autoReconnect?: boolean;

    /**
     * TCP Socket NoDelay option. Default: true
     */
    readonly noDelay?: boolean;

    /**
     * The number of milliseconds to wait before initiating keepAlive on the TCP socket. Default: 30000
     */
    readonly keepAlive?: number;

    /**
     * TCP Connection timeout setting. Default: 30000
     */
    readonly connectTimeoutMS?: number;

    /**
     * TCP Socket timeout setting. Default: 360000
     */
    readonly socketTimeoutMS?: number;

    /**
     * Server attempt to reconnect #times. Default 30
     */
    readonly reconnectTries?: number;

    /**
     * Server will wait #milliseconds between retries. Default 1000
     */
    readonly reconnectInterval?: number;

    /**
     * Turn on high availability monitoring. Default true
     */
    readonly ha?: boolean;

    /**
     * Time between each replicaset status check. Default: 10000,5000
     */
    readonly haInterval?: number;

    /**
     * The name of the replicaset to connect to
     */
    readonly replicaSet?: string;

    /**
     * Sets the range of servers to pick when using NEAREST (lowest ping ms + the latency fence, ex: range of 1 to (1 + 15) ms).
     * Default: 15
     */
    readonly acceptableLatencyMS?: number;

    /**
     * Sets the range of servers to pick when using NEAREST (lowest ping ms + the latency fence, ex: range of 1 to (1 + 15) ms).
     * Default: 15
     */
    readonly secondaryAcceptableLatencyMS?: number;

    /**
     * Sets if the driver should connect even if no primary is available. Default: false
     */
    readonly connectWithNoPrimary?: boolean;

    /**
     * If the database authentication is dependent on another databaseName.
     */
    readonly authSource?: string;

    /**
     * The write concern.
     */
    readonly w?: string|number;

    /**
     * The write concern timeout value.
     */
    readonly wtimeout?: number;

    /**
     * Specify a journal write concern. Default: false
     */
    readonly j?: boolean;

    /**
     * Force server to assign _id values instead of driver. Default: false
     */
    readonly forceServerObjectId?: boolean;

    /**
     * Serialize functions on any object. Default: false
     */
    readonly serializeFunctions?: boolean;

    /**
     * Specify if the BSON serializer should ignore undefined fields. Default: false
     */
    readonly ignoreUndefined?: boolean;

    /**
     * Return document results as raw BSON buffers. Default: false
     */
    readonly raw?: boolean;

    /**
     * Promotes Long values to number if they fit inside the 53 bits resolution. Default: true
     */
    readonly promoteLongs?: boolean;

    /**
     * Promotes Binary BSON values to native Node Buffers. Default: false
     */
    readonly promoteBuffers?: boolean;

    /**
     * Promotes BSON values to native types where possible, set to false to only receive wrapper types. Default: true
     */
    readonly promoteValues?: boolean;

    /**
     * Enable the wrapping of the callback in the current domain, disabled by default to avoid perf hit. Default: false
     */
    readonly domainsEnabled?: boolean;

    /**
     * Sets a cap on how many operations the driver will buffer up before giving up on getting a working connection,
     * default is -1 which is unlimited.
     */
    readonly bufferMaxEntries?: boolean;

    /**
     * The preferred read preference (ReadPreference.PRIMARY, ReadPreference.PRIMARY_PREFERRED, ReadPreference.SECONDARY,
     * ReadPreference.SECONDARY_PREFERRED, ReadPreference.NEAREST).
     */
    readonly readPreference?: ReadPreference;

    /**
     * A primary key factory object for generation of custom _id keys.
     */
    readonly pkFactory?: any;

    /**
     * A Promise library class the application wishes to use such as Bluebird, must be ES6 compatible.
     */
    readonly promiseLibrary?: any;

    /**
     * Specify a read concern for the collection. (only MongoDB 3.2 or higher supported).
     */
    readonly readConcern?: any;

    /**
     * Specify a maxStalenessSeconds value for secondary reads, minimum is 90 seconds
     */
    readonly maxStalenessSeconds?: number;

    /**
     * Specify the log level used by the driver logger (error/warn/info/debug).
     */
    readonly loggerLevel?: "error"|"warn"|"info"|"debug";

}