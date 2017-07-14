import {ConnectionOptions} from "./ConnectionOptions";
import {PlatformTools} from "../platform/PlatformTools";
import {ConnectionOptionsEnvReader} from "./options-reader/ConnectionOptionsEnvReader";
import {ConnectionOptionsYmlReader} from "./options-reader/ConnectionOptionsYmlReader";
import {ConnectionOptionsXmlReader} from "./options-reader/ConnectionOptionsXmlReader";

/**
 * Reads connection options from the ormconfig.
 * Can read from multiple file extensions including env, json, js, xml and yml.
 */
export class ConnectionOptionsReader {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected options?: {
        /**
         * Directory where ormconfig should be read from.
         * By default its your application root (where your app package.json is located).
         */
        root?: string,

        /**
         * Filename of the ormconfig configuration. By default its equal to "ormconfig".
         */
        configName?: string
    }) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Returns all connection options read from the ormconfig.
     */
    async all(): Promise<ConnectionOptions[]> {
        return this.load();
    }

    /**
     * Gets a connection with a given name read from ormconfig.
     * If connection with such name would not be found then it throw error.
     */
    async get(name: string): Promise<ConnectionOptions> {
        const allOptions = await this.all();
        const targetOptions = allOptions.find(options => options.name === name || (name === "default" && !options.name));
        if (!targetOptions)
            throw new Error(`Cannot find connection ${name} because its not defined in any orm configuration files.`);

        return targetOptions;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Loads all connection options from a configuration file.
     *
     * todo: get in count NODE_ENV somehow
     */
    protected async load(): Promise<ConnectionOptions[]> {

        // try to find any of following configuration formats
        const foundFileFormat = ["env", "js", "json", "yml", "yaml", "xml"].find(format => {
            return PlatformTools.fileExist(this.baseFilePath + "." + format);
        });

        // if .env file found then load all its variables into process.env using dotenv package
        if (foundFileFormat === "env") {
            const dotenv = PlatformTools.load("dotenv");
            dotenv.config({ path: this.baseFilePath + ".env" });
        }

        // try to find connection options from any of available sources of configuration
        let connectionOptions: ConnectionOptions|ConnectionOptions[];
        if (PlatformTools.getEnvVariable("TYPEORM_CONNECTION")) {
            connectionOptions = new ConnectionOptionsEnvReader().read();

        } else if (foundFileFormat === "js") {
            connectionOptions = PlatformTools.load(this.baseFilePath + ".js");

        } else if (foundFileFormat === "json") {
            connectionOptions = PlatformTools.load(this.baseFilePath + ".json");

        } else if (foundFileFormat === "yml") {
            connectionOptions = new ConnectionOptionsYmlReader().read(this.baseFilePath + ".yml");

        } else if (foundFileFormat === "yaml") {
            connectionOptions = new ConnectionOptionsYmlReader().read(this.baseFilePath + ".yaml");

        } else if (foundFileFormat === "xml") {
            connectionOptions = await new ConnectionOptionsXmlReader().read(this.baseFilePath + ".xml");

        } else {
            throw new Error(`No connection options were found in any of configurations file.`);
        }

        // normalize and return connection options
        return this.normalizeConnectionOptions(connectionOptions);
    }

    /**
     * Normalize connection options.
     */
    protected normalizeConnectionOptions(connectionOptions: ConnectionOptions|ConnectionOptions[]): ConnectionOptions[] {
        if (!(connectionOptions instanceof Array))
            connectionOptions = [connectionOptions];

        connectionOptions.forEach(options => {

            if (options.entities) {
                const entities = (options.entities as any[]).map(entity => {
                    if (typeof entity === "string" || entity.substr(0, 1) !== "/")
                        return this.baseFilePath + "/" + entity;

                    return entity;
                });
                Object.assign(connectionOptions, { entities: entities });
            }
            if (options.subscribers) {
                const subscribers = (options.subscribers as any[]).map(subscriber => {
                    if (typeof subscriber === "string" || subscriber.substr(0, 1) !== "/")
                        return this.baseFilePath + "/" + subscriber;

                    return subscriber;
                });
                Object.assign(connectionOptions, { subscribers: subscribers });
            }
            if (options.migrations) {
                const migrations = (options.migrations as any[]).map(migration => {
                    if (typeof migration === "string" || migration.substr(0, 1) !== "/")
                        return this.baseFilePath + "/" + migration;

                    return migration;
                });
                Object.assign(connectionOptions, { migrations: migrations });
            }
        });

        return connectionOptions;
    }

    /**
     * Gets directory where configuration file should be located and configuration file name without extension.
     */
    protected get baseFilePath(): string {
        return this.baseDirectory + "/" + this.baseConfigName;
    }

    /**
     * Gets directory where configuration file should be located.
     */
    protected get baseDirectory(): string {
        if (this.options && this.options.root)
            return this.options.root;

        return PlatformTools.load("app-root-path").path;
    }

    /**
     * Gets configuration file name.
     */
    protected get baseConfigName(): string {
        if (this.options && this.options.configName)
            return this.options.configName;

        return "ormconfig";
    }

}