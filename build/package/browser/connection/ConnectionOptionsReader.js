import { __awaiter } from "tslib";
import appRootPath from "app-root-path";
import { PlatformTools } from "../platform/PlatformTools";
import { ConnectionOptionsEnvReader } from "./options-reader/ConnectionOptionsEnvReader";
import { ConnectionOptionsYmlReader } from "./options-reader/ConnectionOptionsYmlReader";
import { ConnectionOptionsXmlReader } from "./options-reader/ConnectionOptionsXmlReader";
/**
 * Reads connection options from the ormconfig.
 * Can read from multiple file extensions including env, json, js, xml and yml.
 */
export class ConnectionOptionsReader {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(options) {
        this.options = options;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Returns all connection options read from the ormconfig.
     */
    all() {
        return __awaiter(this, void 0, void 0, function* () {
            const options = yield this.load();
            if (!options)
                throw new Error(`No connection options were found in any orm configuration files.`);
            return options;
        });
    }
    /**
     * Gets a connection with a given name read from ormconfig.
     * If connection with such name would not be found then it throw error.
     */
    get(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const allOptions = yield this.all();
            const targetOptions = allOptions.find(options => options.name === name || (name === "default" && !options.name));
            if (!targetOptions)
                throw new Error(`Cannot find connection ${name} because its not defined in any orm configuration files.`);
            return targetOptions;
        });
    }
    /**
     * Checks if there is a TypeORM configuration file.
     */
    has(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const allOptions = yield this.load();
            if (!allOptions)
                return false;
            const targetOptions = allOptions.find(options => options.name === name || (name === "default" && !options.name));
            return !!targetOptions;
        });
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Loads all connection options from a configuration file.
     *
     * todo: get in count NODE_ENV somehow
     */
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            let connectionOptions = undefined;
            const fileFormats = ["env", "js", "cjs", "ts", "json", "yml", "yaml", "xml"];
            // Detect if baseFilePath contains file extension
            const possibleExtension = this.baseFilePath.substr(this.baseFilePath.lastIndexOf("."));
            const fileExtension = fileFormats.find(extension => `.${extension}` === possibleExtension);
            // try to find any of following configuration formats
            const foundFileFormat = fileExtension || fileFormats.find(format => {
                return PlatformTools.fileExist(this.baseFilePath + "." + format);
            });
            // Determine config file name
            const configFile = fileExtension ? this.baseFilePath : this.baseFilePath + "." + foundFileFormat;
            // if .env file found then load all its variables into process.env using dotenv package
            if (foundFileFormat === "env") {
                PlatformTools.dotenv(configFile);
            }
            else if (PlatformTools.fileExist(this.baseDirectory + "/.env")) {
                PlatformTools.dotenv(this.baseDirectory + "/.env");
            }
            // try to find connection options from any of available sources of configuration
            if (PlatformTools.getEnvVariable("TYPEORM_CONNECTION") || PlatformTools.getEnvVariable("TYPEORM_URL")) {
                connectionOptions = yield new ConnectionOptionsEnvReader().read();
            }
            else if (foundFileFormat === "js" || foundFileFormat === "cjs" || foundFileFormat === "ts") {
                const configModule = yield require(configFile);
                if (configModule && "__esModule" in configModule && "default" in configModule) {
                    connectionOptions = configModule.default;
                }
                else {
                    connectionOptions = configModule;
                }
            }
            else if (foundFileFormat === "json") {
                connectionOptions = require(configFile);
            }
            else if (foundFileFormat === "yml") {
                connectionOptions = yield new ConnectionOptionsYmlReader().read(configFile);
            }
            else if (foundFileFormat === "yaml") {
                connectionOptions = yield new ConnectionOptionsYmlReader().read(configFile);
            }
            else if (foundFileFormat === "xml") {
                connectionOptions = yield new ConnectionOptionsXmlReader().read(configFile);
            }
            // normalize and return connection options
            if (connectionOptions) {
                return this.normalizeConnectionOptions(connectionOptions);
            }
            return undefined;
        });
    }
    /**
     * Normalize connection options.
     */
    normalizeConnectionOptions(connectionOptions) {
        if (!(Array.isArray(connectionOptions)))
            connectionOptions = [connectionOptions];
        connectionOptions.forEach(options => {
            if (options.entities) {
                const entities = options.entities.map(entity => {
                    if (typeof entity === "string" && entity.substr(0, 1) !== "/")
                        return this.baseDirectory + "/" + entity;
                    return entity;
                });
                Object.assign(connectionOptions, { entities: entities });
            }
            if (options.subscribers) {
                const subscribers = options.subscribers.map(subscriber => {
                    if (typeof subscriber === "string" && subscriber.substr(0, 1) !== "/")
                        return this.baseDirectory + "/" + subscriber;
                    return subscriber;
                });
                Object.assign(connectionOptions, { subscribers: subscribers });
            }
            if (options.migrations) {
                const migrations = options.migrations.map(migration => {
                    if (typeof migration === "string" && migration.substr(0, 1) !== "/")
                        return this.baseDirectory + "/" + migration;
                    return migration;
                });
                Object.assign(connectionOptions, { migrations: migrations });
            }
            // make database path file in sqlite relative to package.json
            if (options.type === "sqlite" || options.type === "better-sqlite3") {
                if (typeof options.database === "string" &&
                    options.database.substr(0, 1) !== "/" && // unix absolute
                    options.database.substr(1, 2) !== ":\\" && // windows absolute
                    options.database !== ":memory:") {
                    Object.assign(options, {
                        database: this.baseDirectory + "/" + options.database
                    });
                }
            }
        });
        return connectionOptions;
    }
    /**
     * Gets directory where configuration file should be located and configuration file name.
     */
    get baseFilePath() {
        return this.baseDirectory + "/" + this.baseConfigName;
    }
    /**
     * Gets directory where configuration file should be located.
     */
    get baseDirectory() {
        if (this.options && this.options.root)
            return this.options.root;
        return appRootPath.path;
    }
    /**
     * Gets configuration file name.
     */
    get baseConfigName() {
        if (this.options && this.options.configName)
            return this.options.configName;
        return "ormconfig";
    }
}

//# sourceMappingURL=ConnectionOptionsReader.js.map
