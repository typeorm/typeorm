import appRootPath from "app-root-path"
import path from "path"

import type { DataSourceOptions } from "../data-source/DataSourceOptions"
import { TypeORMError } from "../error"
import { PlatformTools } from "../platform/PlatformTools"
import { importOrRequireFile } from "../util/ImportUtils"
import { isAbsolute } from "../util/PathUtils"

/**
 * Reads connection options from the ormconfig.
 */
export class ConnectionOptionsReader {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(
        protected options?: {
            /**
             * Directory where ormconfig should be read from.
             * By default its your application root (where your app package.json is located).
             */
            root?: string

            /**
             * Filename of the ormconfig configuration. By default its equal to "ormconfig".
             */
            configName?: string
        },
    ) {}

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Returns all connection options read from the ormconfig.
     */
    async get(): Promise<DataSourceOptions[]> {
        const options = await this.load()
        if (!options)
            throw new TypeORMError(
                `No connection options were found in any orm configuration files.`,
            )

        return options
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Loads all connection options from a configuration file.
     *
     * todo: get in count NODE_ENV somehow
     */
    protected async load(): Promise<DataSourceOptions[] | undefined> {
        let connectionOptions:
            | DataSourceOptions
            | DataSourceOptions[]
            | undefined = undefined

        const fileFormats = ["js", "mjs", "cjs", "ts", "mts", "cts", "json"]

        // Detect if baseFilePath contains file extension
        const possibleExtension = this.baseFilePath.substr(
            this.baseFilePath.lastIndexOf("."),
        )
        const fileExtension = fileFormats.find(
            (extension) => `.${extension}` === possibleExtension,
        )

        // try to find any of following configuration formats
        const foundFileFormat =
            fileExtension ||
            fileFormats.find((format) => {
                return PlatformTools.fileExist(this.baseFilePath + "." + format)
            })

        // Determine config file name
        const configFile = fileExtension
            ? this.baseFilePath
            : this.baseFilePath + "." + foundFileFormat

        // try to find connection options from any of available sources of configuration
        if (
            foundFileFormat === "js" ||
            foundFileFormat === "mjs" ||
            foundFileFormat === "cjs" ||
            foundFileFormat === "ts" ||
            foundFileFormat === "mts" ||
            foundFileFormat === "cts"
        ) {
            try {
                const [importOrRequireResult, moduleSystem] =
                    await importOrRequireFile(configFile)
                const configModule = await importOrRequireResult

                if (
                    moduleSystem === "esm" ||
                    (configModule &&
                        "__esModule" in configModule &&
                        "default" in configModule)
                ) {
                    connectionOptions = configModule.default
                } else {
                    connectionOptions = configModule
                }
            } catch (err) {
                PlatformTools.logWarn(
                    `Warning: Could not load ormconfig file at ${configFile}`,
                    err instanceof Error ? err.message : String(err),
                )
            }
        } else if (foundFileFormat === "json") {
            try {
                connectionOptions = require(configFile)
            } catch (err) {
                PlatformTools.logWarn(
                    `Warning: Could not load ormconfig file at ${configFile}`,
                    err instanceof Error ? err.message : String(err),
                )
            }
        }

        // normalize and return connection options
        if (connectionOptions) {
            return this.normalizeConnectionOptions(connectionOptions)
        }

        return undefined
    }

    /**
     * Normalize connection options.
     * @param connectionOptions
     */
    protected normalizeConnectionOptions(
        connectionOptions: DataSourceOptions | DataSourceOptions[],
    ): DataSourceOptions[] {
        if (!Array.isArray(connectionOptions))
            connectionOptions = [connectionOptions]

        connectionOptions.forEach((options) => {
            options.baseDirectory = this.baseDirectory
            if (options.entities) {
                const entities = (options.entities as any[]).map((entity) => {
                    if (
                        typeof entity === "string" &&
                        entity.substr(0, 1) !== "/"
                    )
                        return this.baseDirectory + "/" + entity

                    return entity
                })
                Object.assign(connectionOptions, { entities: entities })
            }
            if (options.subscribers) {
                const subscribers = (options.subscribers as any[]).map(
                    (subscriber) => {
                        if (
                            typeof subscriber === "string" &&
                            subscriber.substr(0, 1) !== "/"
                        )
                            return this.baseDirectory + "/" + subscriber

                        return subscriber
                    },
                )
                Object.assign(connectionOptions, { subscribers: subscribers })
            }
            if (options.migrations) {
                const migrations = (options.migrations as any[]).map(
                    (migration) => {
                        if (
                            typeof migration === "string" &&
                            migration.substr(0, 1) !== "/"
                        )
                            return this.baseDirectory + "/" + migration

                        return migration
                    },
                )
                Object.assign(connectionOptions, { migrations: migrations })
            }

            // make database path file in sqlite relative to package.json
            if (options.type === "better-sqlite3") {
                if (
                    typeof options.database === "string" &&
                    !isAbsolute(options.database) &&
                    options.database.substr(0, 1) !== "/" && // unix absolute
                    options.database.substr(1, 2) !== ":\\" && // windows absolute
                    options.database !== ":memory:"
                ) {
                    Object.assign(options, {
                        database: this.baseDirectory + "/" + options.database,
                    })
                }
            }
        })

        return connectionOptions
    }

    /**
     * Gets directory where configuration file should be located and configuration file name.
     */
    protected get baseFilePath(): string {
        return path.resolve(this.baseDirectory, this.baseConfigName)
    }

    /**
     * Gets directory where configuration file should be located.
     */
    protected get baseDirectory(): string {
        return this.options?.root ?? appRootPath.path
    }

    /**
     * Gets configuration file name.
     */
    protected get baseConfigName(): string {
        return this.options?.configName ?? "ormconfig"
    }
}
