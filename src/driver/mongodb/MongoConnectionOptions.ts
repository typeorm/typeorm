import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"
import { ReadPreference } from "./typings"

/**
 * MongoDB specific connection options.
 */
export interface MongoConnectionOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "mongodb"

    /**
     * Connection url where the connection is performed.
     */
    readonly url?: string

    /**
     * Database host.
     */
    readonly host?: string

    /**
     * Database host replica set.
     */
    readonly hostReplicaSet?: string

    /**
     * Database host port.
     */
    readonly port?: number

    /**
     * Database username.
     */
    readonly username?: string

    /**
     * Database password.
     */
    readonly password?: string

    /**
     * Database name to connect to.
     */
    readonly database?: string

    /**
     * The driver object
     * This defaults to require("mongodb")
     */
    readonly driver?: any

    /**
     * MongoClientOptions
     * Synced with https://mongodb.github.io/node-mongodb-native/5.9/interfaces/MongoClientOptions.html
     */

    /**
     * The name of the application that created this MongoClient instance.
     * MongoDB 3.4 and newer will print this value in the server log upon establishing each connection.
     * It is also recorded in the slow query log and profile collections
     */
    readonly appName?: string

    /**
     * Specify the authentication mechanism that MongoDB will use to authenticate the connection.
     */
    readonly authMechanism?: string

    /**
     * Specify the database name associated with the user’s credentials.
     */
    readonly authSource?: string

    /**
     * Optionally enable in-use auto encryption
     */
    readonly autoEncryption?: any

    /**
     * Verifies the certificate `cert` is issued to `hostname`.
     */
    readonly checkServerIdentity?: Function

    /**
     * An array or comma-delimited string of compressors to enable network
     * compression for communication between this client and a mongod/mongos instance.
     */
    readonly compressors?: string | string[]

    /**
     * The time in milliseconds to attempt a connection before timing out.
     */
    readonly connectTimeoutMS?: number

    /**
     * Allow a driver to force a Single topology type with a connection string containing one host
     */
    readonly directConnection?: boolean

    /**
     * IP family
     */
    readonly family?: number

    /**
     * Force server to assign `_id` values instead of driver
     */
    readonly forceServerObjectId?: boolean

    /**
     * serialize will not emit undefined fields
     * note that the driver sets this to `false`
     */
    readonly ignoreUndefined?: boolean

    /**
     * @deprecated TCP Connection keep alive enabled. Will not be able to turn off in the future.
     */
    readonly keepAlive?: boolean

    /**
     * @deprecated The number of milliseconds to wait before initiating keepAlive on the TCP socket.
     * Will not be configurable in the future.
     */
    readonly keepAliveInitialDelay?: number

    /**
     * The size (in milliseconds) of the latency window for selecting among multiple suitable MongoDB instances.
     */
    readonly localThresholdMS?: number

    /**
     * Specifies, in seconds, how stale a secondary can be before the client stops using it for read operations.
     */
    readonly maxStalenessSeconds?: number

    /**
     * The minimum number of connections in the connection pool.
     */
    readonly minPoolSize?: number

    /**
     * Enable command monitoring for this client
     */
    readonly monitorCommands?: boolean

    /**
     * TCP Connection no delay
     */
    readonly noDelay?: boolean

    /**
     * A primary key factory function for generation of custom `_id` keys
     */
    readonly pkFactory?: any

    /**
     * when deserializing a Binary will return it as a node.js Buffer instance.
     */
    readonly promoteBuffers?: boolean

    /**
     * when deserializing a Long will fit it into a Number if it's smaller than 53 bits.
     */
    readonly promoteLongs?: boolean

    /**
     * when deserializing will promote BSON values to their Node.js closest equivalent types.
     */
    readonly promoteValues?: boolean

    /**
     * Enabling the raw option will return a Node.js Buffer which is allocated using allocUnsafe API
     */
    readonly raw?: boolean

    /**
     * Specify a read concern for the collection (only MongoDB 3.2 or higher supported)
     */
    readonly readConcern?: any

    /**
     * Specifies the read preferences for this connection
     */
    readonly readPreference?: ReadPreference | string

    /**
     * Specifies the tags document as a comma-separated list of colon-separated key-value pairs.
     */
    readonly readPreferenceTags?: any[]

    /**
     * Specifies the name of the replica set, if the mongod is a member of a replica set.
     */
    readonly replicaSet?: string

    /**
     * Enable retryable writes.
     */
    readonly retryWrites?: boolean

    /**
     * serialize the javascript functions
     */
    readonly serializeFunctions?: boolean

    /**
     * The time in milliseconds to attempt a send or receive on a socket before the attempt times out.
     */
    readonly socketTimeoutMS?: number

    /**
     * @deprecated A boolean to enable or disables TLS/SSL for the connection.
     * (The ssl option is equivalent to the tls option.)
     */
    readonly ssl?: boolean

    /**
     * @deprecated SSL Root Certificate file path.
     *
     * Will be removed in the next major version. Please use tlsCAFile instead.
     */
    readonly sslCA?: string

    /**
     * @deprecated SSL Certificate revocation list file path.
     *
     * Will be removed in the next major version.
     */
    readonly sslCRL?: string

    /**
     * @deprecated SSL Certificate file path.
     *
     * Will be removed in the next major version. Please use tlsCertificateKeyFile instead.
     */
    readonly sslCert?: string

    /**
     * @deprecated SSL Key file file path.
     *
     * Will be removed in the next major version. Please use tlsCertificateKeyFile instead.
     */
    readonly sslKey?: string

    /**
     * @deprecated SSL Certificate pass phrase.
     *
     * Will be removed in the next major version. Please use tlsCertificateKeyFilePassword instead.
     */
    readonly sslPass?: string

    /**
     * @deprecated Validate mongod server certificate against Certificate Authority
     *
     * Will be removed in the next major version. Please use tlsAllowInvalidCertificates instead.
     */
    readonly sslValidate?: boolean

    /**
     * Enables or disables TLS/SSL for the connection.
     */
    readonly tls?: boolean

    /**
     * Bypasses validation of the certificates presented by the mongod/mongos instance
     */
    readonly tlsAllowInvalidCertificates?: boolean

    /**
     * Specifies the location of a local .pem file that contains the root certificate chain from the Certificate Authority.
     */
    readonly tlsCAFile?: string

    /**
     * Specifies the location of a local .pem file that contains the client's TLS/SSL certificate and key.
     */
    readonly tlsCertificateKeyFile?: string

    /**
     * Specifies the password to de-crypt the tlsCertificateKeyFile.
     */
    readonly tlsCertificateKeyFilePassword?: string

    /**
     * @deprecated The write concern w value
     *
     * Please use the `writeConcern` option instead
     */
    readonly w?: string | number

    /**
     * A MongoDB WriteConcern, which describes the level of acknowledgement
     * requested from MongoDB for write operations.
     */
    readonly writeConcern?: any

    /**
     * @deprecated The write concern timeout
     *
     * Please use the `writeConcern` option instead
     */
    readonly wtimeoutMS?: number
}
