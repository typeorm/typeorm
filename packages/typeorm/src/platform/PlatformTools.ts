import { format as sqlFormat } from "@sqltools/formatter"
import { type Config as SqlFormatterConfig } from "@sqltools/formatter/lib/core/types"
import ansi from "ansis"
import crypto from "crypto"
import fs from "fs"
import path from "path"
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
        try {
            switch (name) {
                case "typeorm-aurora-data-api-driver":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("typeorm-aurora-data-api-driver")
                case "better-sqlite3":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("better-sqlite3")
                case "expo-sqlite":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("expo-sqlite")
                case "@google-cloud/spanner":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("@google-cloud/spanner")
                case "mssql":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("mssql")
                case "mongodb":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("mongodb")
                case "mysql2":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("mysql2")
                case "oracledb":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("oracledb")
                case "pg":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("pg")
                case "pg-native":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("pg-native")
                case "pg-query-stream":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("pg-query-stream")
                case "react-native-sqlite-storage":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("react-native-sqlite-storage")
                case "@sap/hana-client":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("@sap/hana-client")
                case "@sap/hana-client/extension/Stream":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("@sap/hana-client/extension/Stream")
                case "sql.js":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("sql.js")
                case "redis":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("redis")
                case "ioredis":
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require("ioredis")
            }
        } catch (e: any) {
            if (
                e?.code !== "MODULE_NOT_FOUND" ||
                !(
                    e.message === `Cannot find module '${name}'` ||
                    e.message.startsWith(`Cannot find module '${name}'\n`)
                )
            ) {
                throw e
            }

            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                return require(
                    path.resolve(process.cwd() + "/node_modules/" + name),
                )
            } catch {
                throw e
            }
        }

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
