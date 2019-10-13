import { ConnectionOptions } from "./ConnectionOptions";
/**
 * Reads connection options from the ormconfig.
 * Can read from multiple file extensions including env, json, js, xml and yml.
 */
export declare class ConnectionOptionsReader {
    protected options?: {
        /**
         * Directory where ormconfig should be read from.
         * By default its your application root (where your app package.json is located).
         */
        root?: string | undefined;
        /**
         * Filename of the ormconfig configuration. By default its equal to "ormconfig".
         */
        configName?: string | undefined;
    } | undefined;
    constructor(options?: {
        /**
         * Directory where ormconfig should be read from.
         * By default its your application root (where your app package.json is located).
         */
        root?: string | undefined;
        /**
         * Filename of the ormconfig configuration. By default its equal to "ormconfig".
         */
        configName?: string | undefined;
    } | undefined);
    /**
     * Returns all connection options read from the ormconfig.
     */
    all(): Promise<ConnectionOptions[]>;
    /**
     * Gets a connection with a given name read from ormconfig.
     * If connection with such name would not be found then it throw error.
     */
    get(name: string): Promise<ConnectionOptions>;
    /**
     * Checks if there is a TypeORM configuration file.
     */
    has(name: string): Promise<boolean>;
    /**
     * Loads all connection options from a configuration file.
     *
     * todo: get in count NODE_ENV somehow
     */
    protected load(): Promise<ConnectionOptions[] | undefined>;
    /**
     * Normalize connection options.
     */
    protected normalizeConnectionOptions(connectionOptions: ConnectionOptions | ConnectionOptions[]): ConnectionOptions[];
    /**
     * Gets directory where configuration file should be located and configuration file name.
     */
    protected readonly baseFilePath: string;
    /**
     * Gets directory where configuration file should be located.
     */
    protected readonly baseDirectory: string;
    /**
     * Gets configuration file name.
     */
    protected readonly baseConfigName: string;
}
