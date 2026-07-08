import type { Driver } from "./Driver"
import { hash, shorten } from "../util/StringUtils"
import { VersionUtils } from "../util/VersionUtils"
import { TypeORMError } from "../error/TypeORMError"

/**
 * Common driver utility functions.
 */
export class DriverUtils {
    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------

    /**
     * Returns true if given driver is SQLite-based driver.
     *
     * @param driver
     */
    static isSQLiteFamily(driver: Driver): boolean {
        return [
            "better-sqlite3",
            "capacitor",
            "cordova",
            "expo",
            "nativescript",
            "react-native",
            "sqljs",
        ].includes(driver.options.type)
    }

    /**
     * Returns true if given driver is MySQL-based driver.
     *
     * @param driver
     */
    static isMySQLFamily(driver: Driver): boolean {
        return ["mysql", "mariadb"].includes(driver.options.type)
    }

    static isReleaseVersionOrGreater(driver: Driver, version: string): boolean {
        return VersionUtils.isGreaterOrEqual(driver.version, version)
    }

    static isPostgresFamily(driver: Driver): boolean {
        return ["postgres", "aurora-postgres", "cockroachdb"].includes(
            driver.options.type,
        )
    }

    /**
     * Builds a "connect" handler that applies session parameters to every new
     * pooled connection via `set_config(<key>, <value>, false)`. Returns
     * `undefined` when no session parameters are configured. The caller is
     * responsible for registering the returned handler on its pool.
     *
     * `set_config()` is used rather than `SET <key> TO <value>` because PostgreSQL
     * does not accept bind parameters in the `SET` utility statement; `set_config`
     * is a regular parameterized function call supported by both PostgreSQL and
     * CockroachDB. The parameter name and value are bound, so nothing is
     * interpolated into the SQL text.
     *
     * Parameter names are validated up front: any key that is not a valid session
     * parameter identifier throws a `TypeORMError`, so a misconfiguration fails
     * loudly during connection setup rather than being silently dropped.
     *
     * Callers should apply the returned handler to the first connection during
     * pool setup — so an invalid value or unknown parameter fails initialization
     * instead of leaving pooled connections silently unconfigured — and register
     * it as the pool's `connect` listener for every subsequently created
     * connection.
     *
     * @param sessionParameters Session parameters to apply, keyed by parameter name.
     * @returns A pool "connect" handler, or `undefined` when nothing is configured.
     */
    static buildSessionParametersHandler(
        sessionParameters?: Record<string, any>,
    ): ((connection: any) => Promise<void>) | undefined {
        if (!sessionParameters) return undefined

        // Session parameter names are plain identifiers, optionally namespaced
        // with a dot for custom parameters (e.g. "my_app.setting").
        const validSessionParameterKey =
            /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/
        for (const key of Object.keys(sessionParameters)) {
            if (!validSessionParameterKey.test(key))
                throw new TypeORMError(
                    `Invalid session parameter name "${key}". Session parameter names must be valid identifiers.`,
                )
            if (sessionParameters[key] == null)
                throw new TypeORMError(
                    `Invalid value for session parameter "${key}": value must not be null or undefined.`,
                )
        }

        return async (connection: any) => {
            // `.map` runs synchronously, so every query is issued (and thus queued
            // on the connection) before the pool can hand it out; awaiting between
            // queries would let the client be acquired with only the first
            // parameter guaranteed to be applied.
            await Promise.all(
                Object.keys(sessionParameters).map((key) =>
                    connection.query("SELECT set_config($1, $2, false)", [
                        key,
                        String(sessionParameters[key]),
                    ]),
                ),
            )
        }
    }

    /**
     * Normalizes and builds a new driver options.
     * Extracts settings from connection url and sets to a new options object.
     *
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
     *
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
     *
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
        const joiner = buildOptions?.joiner ?? "_"

        const newAlias = alias.length === 1 ? alias[0] : alias.join(joiner)

        if (
            maxAliasLength &&
            maxAliasLength > 0 &&
            newAlias.length > maxAliasLength
        ) {
            if (buildOptions?.shorten === true) {
                const shortenedAlias = shorten(newAlias)
                if (shortenedAlias.length < maxAliasLength) {
                    return shortenedAlias
                }
            }

            return hash(newAlias, { length: maxAliasLength })
        }

        return newAlias
    }

    // -------------------------------------------------------------------------
    // Private Static Methods
    // -------------------------------------------------------------------------

    /**
     * Extracts connection data from the connection url.
     *
     * @param url
     */
    private static parseConnectionUrl(url: string) {
        const type = url.split(":")[0]
        const firstSlashes = url.indexOf("//")
        const preBase = url.slice(firstSlashes + 2)
        const secondSlash = preBase.indexOf("/")
        const base =
            secondSlash === -1 ? preBase : preBase.slice(0, secondSlash)
        let afterBase =
            secondSlash === -1 ? undefined : preBase.slice(secondSlash + 1)
        // remove mongodb query params
        if (afterBase && afterBase.indexOf("?") !== -1) {
            afterBase = afterBase.slice(0, afterBase.indexOf("?"))
        }
        // normalize empty string to undefined so downstream ?? works correctly
        if (afterBase === "") afterBase = undefined

        const { username, password, hostAndPort } = this.parseCredentials(base)
        const [host, port] = hostAndPort.split(":")

        return {
            type: type,
            host: host,
            username: decodeURIComponent(username),
            password: decodeURIComponent(password),
            port: port ? parseInt(port) : undefined,
            database: afterBase ?? undefined,
        }
    }

    /**
     * Extracts connection data from the connection url for MongoDB to support replica set.
     *
     * @param url
     */
    private static parseMongoDBConnectionUrl(url: string) {
        const type = url.split(":")[0]
        const firstSlashes = url.indexOf("//")
        const preBase = url.slice(firstSlashes + 2)
        const secondSlash = preBase.indexOf("/")
        const base =
            secondSlash === -1 ? preBase : preBase.slice(0, secondSlash)
        let afterBase =
            secondSlash === -1 ? undefined : preBase.slice(secondSlash + 1)
        // normalize empty string to undefined so downstream ?? works correctly
        if (afterBase === "") afterBase = undefined
        let afterQuestionMark: string
        let host = undefined
        let port = undefined
        let hostReplicaSet = undefined
        let replicaSet = undefined

        const optionsObject: any = {}

        if (afterBase && afterBase.indexOf("?") !== -1) {
            // split params
            afterQuestionMark = afterBase.slice(afterBase.indexOf("?") + 1)

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
            afterBase = afterBase.slice(0, afterBase.indexOf("?"))
        }

        const { username, password, hostAndPort } = this.parseCredentials(base)

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
            database: afterBase ?? undefined,
        }

        // Loop to set every options in connectionUrl to object
        for (const [key, value] of Object.entries(optionsObject)) {
            connectionUrl[key] = value
        }

        return connectionUrl
    }

    private static parseCredentials(base: string): {
        username: string
        password: string
        hostAndPort: string
    } {
        const lastAtSign = base.lastIndexOf("@")
        if (lastAtSign === -1) {
            return { username: "", password: "", hostAndPort: base }
        }

        const hostAndPort = base.slice(lastAtSign + 1)
        const credentials = base.slice(0, lastAtSign)
        const colonIndex = credentials.indexOf(":")

        return colonIndex === -1
            ? { username: credentials, password: "", hostAndPort }
            : {
                  username: credentials.slice(0, colonIndex),
                  password: credentials.slice(colonIndex + 1),
                  hostAndPort,
              }
    }
}
