import { format as sqlFormat } from "@sqltools/formatter"
import { type Config as SqlFormatterConfig } from "@sqltools/formatter/lib/core/types"
import ansi from "ansis"
import crypto from "crypto"
import fs, { type ReadStream } from "fs"
import path from "path"
import { Readable } from "stream"
import { highlight } from "sql-highlight"
import { type DatabaseType } from "../driver/types/DatabaseType"

export { EventEmitter } from "events"
export { ReadStream } from "fs"
export { Readable, Writable } from "stream"

/**
 * Platform-specific tools.
 */
export class PlatformTools {
    /**
     * Type of the currently running platform.
     */
    static type: "browser" | "node" = "node"

    /**
     * Wait for transaction finalization before exposing stream completion.
     * PostgreSQL closes its cursor asynchronously on early destruction.
     */
    static wrapQueryStream(
        cursor: ReadStream,
        finalize: (commit: boolean) => Promise<void>,
    ): ReadStream {
        let finalization: Promise<void> | undefined
        const commit = () => {
            if (output.destroyed || finalization) return
            finalization = finalize(true)
            void finalization.then(
                () => {
                    if (!output.destroyed) output.push(null)
                },
                (error) => output.destroy(error),
            )
        }
        cursor.pause()
        const output = new Readable({
            objectMode: true,
            // The cursor already buffers rows. Pull them only as requested.
            highWaterMark: 0,
            read() {
                cursor.resume()
            },
            destroy(error, callback) {
                const afterClose = () => {
                    finalization ??= finalize(false)
                    finalization.then(
                        () => callback(error),
                        (failure) => callback(error ?? failure),
                    )
                }
                if (cursor.closed) return afterClose()
                cursor.once("close", afterClose)
                cursor.destroy()
            },
        })
        cursor.on("data", (row) => {
            if (!output.push(row)) cursor.pause()
        })
        cursor.once("end", () => {
            if (output.readableLength === 0) return commit()
            // Observe buffered rows being read without resuming a paused stream.
            const onRow = () => {
                if (output.readableLength !== 0) return
                output.removeListener("data", onRow)
                queueMicrotask(commit)
            }
            output.prependListener("data", onRow)
            output.once("close", () => output.removeListener("data", onRow))
        })
        cursor.once("error", (error) => output.destroy(error))
        cursor.once("close", () => {
            if (!cursor.readableEnded) output.destroy()
        })
        return output as ReadStream
    }

    /**
     * @returns the platform-specific global variable
     */
    static getGlobalVariable(): any {
        if (typeof globalThis !== "undefined") {
            return globalThis
        }
        return global
    }

    /**
     * Loads ("require"-s) given file or package.
     * This operation is only supported on the NodeJS platform
     *
     * @param name name of the module to be imported
     * @returns the module
     */
    static load(name: string): any {
        /* eslint-disable @typescript-eslint/no-require-imports */
        try {
            // Use literal requires on purpose so bundlers can trace the client libraries.
            // Wrapped in try-catch so bundlers can identify the libraries as optional dependencies.
            switch (name) {
                // AWS Aurora Data API (PostgreSQL/MySQL)
                case "typeorm-aurora-data-api-driver":
                    return require("typeorm-aurora-data-api-driver")
                // better-sqlite3
                case "better-sqlite3":
                    return require("better-sqlite3")
                // Expo
                case "expo-sqlite":
                    return require("expo-sqlite")
                // Google Cloud Spanner
                case "@google-cloud/spanner":
                    return require("@google-cloud/spanner")
                // Microsoft SQL Server
                case "mssql":
                    return require("mssql")
                // MongoDB
                case "mongodb":
                    return require("mongodb")
                // MySQL / MariaDB
                case "mysql2":
                    return require("mysql2")
                // Oracle
                case "oracledb":
                    return require("oracledb")
                // PostgreSQL
                case "pg":
                    return require("pg")
                case "pg-native":
                    return require("pg-native")
                case "pg-query-stream":
                    return require("pg-query-stream")
                // React Native
                case "react-native-sqlite-storage":
                    return require("react-native-sqlite-storage")
                // SAP HANA
                case "@sap/hana-client":
                    return require("@sap/hana-client")
                case "@sap/hana-client/extension/Stream":
                    return require("@sap/hana-client/extension/Stream")
                // sql.js
                case "sql.js":
                    return require("sql.js")
                // redis
                case "redis":
                    return require("redis")
                case "ioredis":
                    return require("ioredis")
            }
        } catch (error) {
            if (error?.code !== "MODULE_NOT_FOUND") {
                throw error
            }

            return require(path.join(process.cwd(), "node_modules", name))
        }
        /* eslint-enable @typescript-eslint/no-require-imports */

        throw new TypeError(`Invalid Package for PlatformTools.load: ${name}`)
    }

    /**
     * Returns a SHA-1 hex digest for internal IDs/aliases (not for cryptographic security)
     *
     * @param input string to encode
     * @returns the SHA-1 digest of the input string
     */
    static sha1(input: string): string {
        const hashFunction = crypto.createHash("sha1")
        hashFunction.update(input, "utf8")

        return hashFunction.digest("hex")
    }

    /**
     * Normalizes given path. Does "path.normalize" and replaces backslashes with forward slashes on Windows.
     *
     * @param pathStr
     */
    static pathNormalize(pathStr: string): string {
        let normalizedPath = path.normalize(pathStr)
        if (process.platform === "win32")
            normalizedPath = normalizedPath.replaceAll("\\", "/")
        return normalizedPath
    }

    /**
     * Returns the extension of the given path. Does "path.extname".
     *
     * @param pathStr
     */
    static pathExtname(pathStr: string): string {
        return path.extname(pathStr)
    }

    /**
     * Resolves the given paths. Does "path.resolve".
     *
     * @param paths
     */
    static pathResolve(...paths: string[]): string {
        return path.resolve(...paths)
    }

    /**
     * Synchronously checks if file exists. Does "fs.existsSync".
     *
     * @param pathStr
     */
    static fileExist(pathStr: string): boolean {
        return fs.existsSync(pathStr)
    }

    static readFileSync(filename: string): Uint8Array {
        return fs.readFileSync(filename)
    }

    static appendFileSync(filename: string, data: any): void {
        fs.appendFileSync(filename, data)
    }

    static async writeFile(path: string, data: any): Promise<void> {
        return fs.promises.writeFile(path, data)
    }

    /**
     * Highlights sql string to be printed in the console.
     *
     * @param sql
     */
    static highlightSql(sql: string) {
        return highlight(sql, {
            colors: {
                keyword: ansi.blueBright.open,
                function: ansi.magentaBright.open,
                number: ansi.green.open,
                string: ansi.white.open,
                identifier: ansi.white.open,
                special: ansi.white.open,
                bracket: ansi.white.open,
                comment: ansi.gray.open,
                clear: ansi.reset.open,
            },
        })
    }

    /**
     * Pretty-print sql string to be print in the console.
     *
     * @param sql
     * @param dataSourceType
     */
    static formatSql(sql: string, dataSourceType?: DatabaseType): string {
        const databaseLanguageMap: Record<
            string,
            SqlFormatterConfig["language"]
        > = {
            oracle: "pl/sql",
        }

        const databaseLanguage = dataSourceType
            ? (databaseLanguageMap[dataSourceType] ?? "sql")
            : "sql"

        return sqlFormat(sql, {
            language: databaseLanguage,
            indent: "    ",
        })
    }

    /**
     * Logging functions needed by AdvancedConsoleLogger
     *
     * @param prefix
     * @param info
     */
    static logInfo(prefix: string, info: any) {
        console.log(ansi.gray.underline(prefix), info)
    }

    static logError(prefix: string, error: any) {
        console.log(ansi.underline.red(prefix), error)
    }

    static logWarn(prefix: string, warning: any) {
        console.log(ansi.underline.yellow(prefix), warning)
    }

    static log(message: string) {
        console.log(ansi.underline(message))
    }

    static info(info: any) {
        return ansi.gray(info)
    }

    static error(error: any) {
        return ansi.red(error)
    }

    static warn(message: string) {
        return ansi.yellow(message)
    }

    static logCmdErr(prefix: string, err?: any) {
        console.log(ansi.black.bgRed(prefix))
        if (err) console.error(err)
    }
}
