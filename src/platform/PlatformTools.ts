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
        const KNOWN_MODULES = [
            // AWS Aurora Data API (PostgreSQL/MySQL)
            "typeorm-aurora-data-api-driver",
            // better-sqlite3
            "better-sqlite3",
            // Expo
            "expo-sqlite",
            // Google Cloud Spanner
            "@google-cloud/spanner",
            // Microsoft SQL Server
            "mssql",
            // MongoDB
            "mongodb",
            // MySQL / MariaDB
            "mysql2",
            // Oracle
            "oracledb",
            // PostgreSQL
            "pg",
            "pg-native",
            "pg-query-stream",
            "postgres",
            // React Native
            "react-native-sqlite-storage",
            // SAP HANA
            "@sap/hana-client",
            "@sap/hana-client/extension/Stream",
            // sql.js
            "sql.js",
            // redis
            "redis",
            "ioredis",
        ]

        if (!KNOWN_MODULES.includes(name)) {
            throw new TypeError(
                `Invalid Package for PlatformTools.load: ${name}`,
            )
        }

        // if name is not absolute or relative, then try to load package from the node_modules of the directory we are currently in
        // this is useful when we are using typeorm package globally installed and it accesses drivers
        // that are not installed globally
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            return require(name)
        } catch {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            return require(
                path.resolve(process.cwd() + "/node_modules/" + name),
            )
        }
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
     * Gets file extension. Does "path.extname".
     *
     * @param pathStr
     */
    static pathExtname(pathStr: string): string {
        return path.extname(pathStr)
    }

    /**
     * Resolved given path. Does "path.resolve".
     *
     * @param paths
     */
    static pathResolve(...paths: string[]): string {
        return path.resolve(...paths)
    }

    /**
     * Synchronously checks if file exist. Does "fs.existsSync".
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
