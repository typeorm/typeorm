import { Driver } from "./Driver"
import { hash, shorten } from "../util/StringUtils"
import { VersionUtils } from "../util/VersionUtils"

/**
 * Common driver utility functions.
 */
export class DriverUtils {
    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------

    /**
     * Returns true if given driver is SQLite-based driver.
     * @param driver
     * @deprecated Use specific capability checks instead (e.g., getUpsertStyle, getPaginationStyle)
     */
    static isSQLiteFamily(driver: Driver): boolean {
        return [
            "sqlite",
            "cordova",
            "react-native",
            "nativescript",
            "sqljs",
            "expo",
            "better-sqlite3",
            "capacitor",
        ].includes(driver.options.type)
    }

    /**
     * Returns true if given driver is MySQL-based driver.
     * @param driver
     * @deprecated Use specific capability checks instead (e.g., supportsUseIndexHint, getStringAggregationStyle, supportsLimitInUpdate)
     */
    static isMySQLFamily(driver: Driver): boolean {
        return ["mysql", "mariadb"].includes(driver.options.type)
    }

    static isReleaseVersionOrGreater(driver: Driver, version: string): boolean {
        return VersionUtils.isGreaterOrEqual(driver.version, version)
    }

    /**
     * Returns true if given driver is PostgreSQL-based driver.
     * @param driver
     * @deprecated Use specific capability checks instead (e.g., supportsDistinctOn, getForShareStyle, supportsLockOfTables)
     */
    static isPostgresFamily(driver: Driver): boolean {
        return ["postgres", "aurora-postgres", "cockroachdb"].includes(
            driver.options.type,
        )
    }

    // =========================================================================
    // CAPABILITY-BASED HELPER METHODS
    // These replace all is*Family checks with specific feature detection
    // =========================================================================

    /**
     * Check if driver supports USE INDEX hint
     * @param driver
     */
    static supportsUseIndexHint(driver: Driver): boolean {
        return driver.capabilities.useIndexHint === true
    }

    /**
     * Check if driver supports MAX_EXECUTION_TIME hint
     * @param driver
     */
    static supportsMaxExecutionTimeHint(driver: Driver): boolean {
        return driver.capabilities.maxExecutionTimeHint === true
    }

    /**
     * Check if driver supports DISTINCT ON syntax
     * @param driver
     */
    static supportsDistinctOn(driver: Driver): boolean {
        return driver.capabilities.distinctOn === true
    }

    /**
     * Get the string aggregation function style
     * @param driver
     */
    static getStringAggregationStyle(
        driver: Driver,
    ): "GROUP_CONCAT" | "STRING_AGG" | "LISTAGG" | null {
        return driver.capabilities.stringAggregation ?? null
    }

    /**
     * Get the pagination style
     * @param driver
     */
    static getPaginationStyle(
        driver: Driver,
    ): "LIMIT_OFFSET" | "TOP" | "FETCH_FIRST" | "ROWNUM" {
        return driver.capabilities.pagination ?? "LIMIT_OFFSET"
    }

    /**
     * Get the upsert style for this driver
     * @param driver
     */
    static getUpsertStyle(
        driver: Driver,
    ): "ON_CONFLICT" | "ON_DUPLICATE_KEY" | "MERGE_INTO" | null {
        return driver.capabilities.upsertStyle ?? null
    }

    /**
     * Check if driver supports WHERE clause in ON CONFLICT
     * @param driver
     */
    static supportsUpsertConflictWhere(driver: Driver): boolean {
        return driver.capabilities.upsertConflictWhere === true
    }

    /**
     * Check if driver supports RETURNING for a specific operation
     * @param driver
     * @param operation
     */
    static supportsReturning(
        driver: Driver,
        operation: "insert" | "update" | "delete",
    ): boolean {
        switch (operation) {
            case "insert":
                return driver.capabilities.returningInsert === true
            case "update":
                return driver.capabilities.returningUpdate === true
            case "delete":
                return driver.capabilities.returningDelete === true
        }
    }

    /**
     * Get the RETURNING clause style
     * @param driver
     */
    static getReturningStyle(driver: Driver): "RETURNING" | "OUTPUT" | null {
        return driver.capabilities.returningStyle ?? null
    }

    /**
     * Check if RETURNING requires INTO clause (Oracle)
     * @param driver
     */
    static returningRequiresInto(driver: Driver): boolean {
        return driver.capabilities.returningRequiresInto === true
    }

    /**
     * Check if driver supports LIMIT in UPDATE
     * @param driver
     */
    static supportsLimitInUpdate(driver: Driver): boolean {
        return driver.capabilities.limitInUpdate === true
    }

    /**
     * Check if driver supports LIMIT in DELETE
     * @param driver
     */
    static supportsLimitInDelete(driver: Driver): boolean {
        return driver.capabilities.limitInDelete === true
    }

    /**
     * Check if driver supports JOIN in UPDATE
     * @param driver
     */
    static supportsJoinInUpdate(driver: Driver): boolean {
        return driver.capabilities.joinInUpdate === true
    }

    /**
     * Check if driver supports FOR UPDATE
     * @param driver
     */
    static supportsForUpdate(driver: Driver): boolean {
        return driver.capabilities.forUpdate === true
    }

    /**
     * Get the FOR SHARE locking style
     * @param driver
     */
    static getForShareStyle(
        driver: Driver,
    ): "FOR_SHARE" | "LOCK_IN_SHARE_MODE" | null {
        return driver.capabilities.forShareStyle ?? null
    }

    /**
     * Check if driver supports FOR KEY SHARE (Postgres)
     * @param driver
     */
    static supportsForKeyShare(driver: Driver): boolean {
        return driver.capabilities.forKeyShare === true
    }

    /**
     * Check if driver supports FOR NO KEY UPDATE (Postgres)
     * @param driver
     */
    static supportsForNoKeyUpdate(driver: Driver): boolean {
        return driver.capabilities.forNoKeyUpdate === true
    }

    /**
     * Check if driver supports SKIP LOCKED
     * @param driver
     */
    static supportsSkipLocked(driver: Driver): boolean {
        return driver.capabilities.skipLocked === true
    }

    /**
     * Check if driver supports NOWAIT
     * @param driver
     */
    static supportsNowait(driver: Driver): boolean {
        return driver.capabilities.nowait === true
    }

    /**
     * Check if driver supports OF table_name in locking
     * @param driver
     */
    static supportsLockOfTables(driver: Driver): boolean {
        return driver.capabilities.lockOfTables === true
    }

    /**
     * Check if columns require explicit length (e.g., VARCHAR(255))
     * @param driver
     */
    static requiresColumnLength(driver: Driver): boolean {
        return driver.capabilities.requiresColumnLength === true
    }

    /**
     * Get supported index types
     * @param driver
     */
    static getSupportedIndexTypes(driver: Driver): string[] {
        return driver.capabilities.indexTypes ?? []
    }

    /**
     * Get default index type
     * @param driver
     */
    static getDefaultIndexType(driver: Driver): string | undefined {
        return driver.capabilities.defaultIndexType
    }

    /**
     * Check if driver supports partial indexes
     * @param driver
     */
    static supportsPartialIndexes(driver: Driver): boolean {
        return driver.capabilities.partialIndexes === true
    }

    /**
     * Check if driver supports expression indexes
     * @param driver
     */
    static supportsExpressionIndexes(driver: Driver): boolean {
        return driver.capabilities.expressionIndexes === true
    }

    /**
     * Get transaction support level
     * @param driver
     */
    static getTransactionSupport(driver: Driver): "nested" | "simple" | "none" {
        return driver.capabilities.transactionSupport ?? "none"
    }

    /**
     * Check if driver supports CTEs
     * @param driver
     */
    static supportsCte(driver: Driver): boolean {
        return driver.capabilities.cteEnabled === true
    }

    /**
     * Check if driver supports recursive CTEs
     * @param driver
     */
    static supportsRecursiveCte(driver: Driver): boolean {
        return driver.capabilities.cteRecursive === true
    }

    /**
     * Check if driver supports writable CTEs
     * @param driver
     */
    static supportsWritableCte(driver: Driver): boolean {
        return driver.capabilities.cteWritable === true
    }

    /**
     * Normalizes and builds a new driver options.
     * Extracts settings from connection url and sets to a new options object.
     * @param options
     * @param buildOptions
     * @param buildOptions.useSid
     */
    static buildDriverOptions(
        options: any,
        buildOptions?: { useSid: boolean },
    ): any {
        if (options.url) {
            const urlDriverOptions = this.parseConnectionUrl(options.url) as {
                [key: string]: any
            }

            if (
                buildOptions &&
                buildOptions.useSid &&
                urlDriverOptions.database
            ) {
                urlDriverOptions.sid = urlDriverOptions.database
            }

            for (const key of Object.keys(urlDriverOptions)) {
                if (typeof urlDriverOptions[key] === "undefined") {
                    delete urlDriverOptions[key]
                }
            }

            return Object.assign({}, options, urlDriverOptions)
        }
        return Object.assign({}, options)
    }

    /**
     * buildDriverOptions for MongodDB only to support replica set
     * @param options
     * @param buildOptions
     * @param buildOptions.useSid
     */
    static buildMongoDBDriverOptions(
        options: any,
        buildOptions?: { useSid: boolean },
    ): any {
        if (options.url) {
            const urlDriverOptions = this.parseMongoDBConnectionUrl(
                options.url,
            ) as { [key: string]: any }

            if (
                buildOptions &&
                buildOptions.useSid &&
                urlDriverOptions.database
            ) {
                urlDriverOptions.sid = urlDriverOptions.database
            }

            for (const key of Object.keys(urlDriverOptions)) {
                if (typeof urlDriverOptions[key] === "undefined") {
                    delete urlDriverOptions[key]
                }
            }

            return Object.assign({}, options, urlDriverOptions)
        }
        return Object.assign({}, options)
    }

    /**
     * Joins and shortens alias if needed.
     *
     * If the alias length is greater than the limit allowed by the current
     * driver, replaces it with a shortend string, if the shortend string
     * is still too long, it will then hash the alias.
     * @param driver Current `Driver`.
     * @param driver.maxAliasLength
     * @param buildOptions Optional settings.
     * @param alias Alias parts.
     * @returns An alias that is no longer than the divers max alias length.
     */
    static buildAlias(
        { maxAliasLength }: Driver,
        buildOptions: { shorten?: boolean; joiner?: string } | undefined,
        ...alias: string[]
    ): string {
        const joiner =
            buildOptions && buildOptions.joiner ? buildOptions.joiner : "_"

        const newAlias = alias.length === 1 ? alias[0] : alias.join(joiner)

        if (
            maxAliasLength &&
            maxAliasLength > 0 &&
            newAlias.length > maxAliasLength
        ) {
            if (buildOptions && buildOptions.shorten === true) {
                const shortenedAlias = shorten(newAlias)
                if (shortenedAlias.length < maxAliasLength) {
                    return shortenedAlias
                }
            }

            return hash(newAlias, { length: maxAliasLength })
        }

        return newAlias
    }

    /**
     * @param root0
     * @param root0.maxAliasLength
     * @param buildOptions
     * @param alias
     * @deprecated use `buildAlias` instead.
     */
    static buildColumnAlias(
        { maxAliasLength }: Driver,
        buildOptions: { shorten?: boolean; joiner?: string } | string,
        ...alias: string[]
    ) {
        if (typeof buildOptions === "string") {
            alias.unshift(buildOptions)
            buildOptions = { shorten: false, joiner: "_" }
        } else {
            buildOptions = Object.assign(
                { shorten: false, joiner: "_" },
                buildOptions,
            )
        }
        return this.buildAlias(
            { maxAliasLength } as Driver,
            buildOptions,
            ...alias,
        )
    }

    // -------------------------------------------------------------------------
    // Private Static Methods
    // -------------------------------------------------------------------------

    /**
     * Extracts connection data from the connection url.
     * @param url
     */
    private static parseConnectionUrl(url: string) {
        const type = url.split(":")[0]
        const firstSlashes = url.indexOf("//")
        const preBase = url.substr(firstSlashes + 2)
        const secondSlash = preBase.indexOf("/")
        const base =
            secondSlash !== -1 ? preBase.substr(0, secondSlash) : preBase
        let afterBase =
            secondSlash !== -1 ? preBase.substr(secondSlash + 1) : undefined
        // remove mongodb query params
        if (afterBase && afterBase.indexOf("?") !== -1) {
            afterBase = afterBase.substr(0, afterBase.indexOf("?"))
        }

        const lastAtSign = base.lastIndexOf("@")
        const usernameAndPassword = base.substr(0, lastAtSign)
        const hostAndPort = base.substr(lastAtSign + 1)

        let username = usernameAndPassword
        let password = ""
        const firstColon = usernameAndPassword.indexOf(":")
        if (firstColon !== -1) {
            username = usernameAndPassword.substr(0, firstColon)
            password = usernameAndPassword.substr(firstColon + 1)
        }
        const [host, port] = hostAndPort.split(":")

        return {
            type: type,
            host: host,
            username: decodeURIComponent(username),
            password: decodeURIComponent(password),
            port: port ? parseInt(port) : undefined,
            database: afterBase || undefined,
        }
    }

    /**
     * Extracts connection data from the connection url for MongoDB to support replica set.
     * @param url
     */
    private static parseMongoDBConnectionUrl(url: string) {
        const type = url.split(":")[0]
        const firstSlashes = url.indexOf("//")
        const preBase = url.substr(firstSlashes + 2)
        const secondSlash = preBase.indexOf("/")
        const base =
            secondSlash !== -1 ? preBase.substr(0, secondSlash) : preBase
        let afterBase =
            secondSlash !== -1 ? preBase.substr(secondSlash + 1) : undefined
        let afterQuestionMark = ""
        let host = undefined
        let port = undefined
        let hostReplicaSet = undefined
        let replicaSet = undefined

        const optionsObject: any = {}

        if (afterBase && afterBase.indexOf("?") !== -1) {
            // split params
            afterQuestionMark = afterBase.substr(
                afterBase.indexOf("?") + 1,
                afterBase.length,
            )

            const optionsList = afterQuestionMark.split("&")
            let optionKey: string
            let optionValue: string

            // create optionsObject for merge with connectionUrl object before return
            optionsList.forEach((optionItem) => {
                optionKey = optionItem.split("=")[0]
                optionValue = optionItem.split("=")[1]
                optionsObject[optionKey] = optionValue
            })

            // specific replicaSet value to set options about hostReplicaSet
            replicaSet = optionsObject["replicaSet"]
            afterBase = afterBase.substr(0, afterBase.indexOf("?"))
        }

        const lastAtSign = base.lastIndexOf("@")
        const usernameAndPassword = base.substr(0, lastAtSign)
        const hostAndPort = base.substr(lastAtSign + 1)

        let username = usernameAndPassword
        let password = ""
        const firstColon = usernameAndPassword.indexOf(":")
        if (firstColon !== -1) {
            username = usernameAndPassword.substr(0, firstColon)
            password = usernameAndPassword.substr(firstColon + 1)
        }

        // If replicaSet have value set It as hostlist, If not set like standalone host
        if (replicaSet) {
            hostReplicaSet = hostAndPort
        } else {
            ;[host, port] = hostAndPort.split(":")
        }

        const connectionUrl: any = {
            type: type,
            host: host,
            hostReplicaSet: hostReplicaSet,
            username: decodeURIComponent(username),
            password: decodeURIComponent(password),
            port: port ? parseInt(port) : undefined,
            database: afterBase || undefined,
        }

        // Loop to set every options in connectionUrl to object
        for (const [key, value] of Object.entries(optionsObject)) {
            connectionUrl[key] = value
        }

        return connectionUrl
    }
}
