import * as path from "path"
import * as fs from "fs"
import dotenv from "dotenv"
import chalk from "chalk"
import { type Theme } from "cli-highlight"

export { ReadStream } from "fs"
export { EventEmitter } from "events"
export { Readable, Writable } from "stream"

const highlight =
    process.env.DISABLE_CLI_HIGHLIGHT === "true"
        ? (str: string) => str
        : require("cli-highlight").highlight

/**
 * Platform-specific tools.
 */
export class PlatformTools {
    /**
     * Type of the currently running platform.
     */
    static type: "browser" | "node" = "node"

    /**
     * Gets global variable where global stuff can be stored.
     */
    static getGlobalVariable(): any {
        return global
    }

    /**
     * Loads ("require"-s) given file or package.
     * This operation only supports on node platform
     */
    static load(name: string): any {
        // if name is not absolute or relative, then try to load package from the node_modules of the directory we are currently in
        // this is useful when we are using typeorm package globally installed and it accesses drivers
        // that are not installed globally

        try {
            // switch case to explicit require statements for webpack compatibility.
            switch (name) {
                /**
                 * spanner
                 */
                case "spanner":
                    return require("@google-cloud/spanner")

                /**
                 * mongodb
                 */
                case "mongodb":
                    return require("mongodb")

                /**
                 * hana
                 */
                case "@sap/hana-client":
                    return require("@sap/hana-client")

                case "hdb-pool":
                    return require("hdb-pool")

                /**
                 * mysql
                 */
                case "mysql":
                    return require("mysql")

                case "mysql2":
                    return require("mysql2")

                /**
                 * oracle
                 */
                case "oracledb":
                    return require("oracledb")

                /**
                 * postgres
                 */
                case "pg":
                    return require("pg")

                case "pg-native":
                    return require("pg-native")

                case "pg-query-stream":
                    return require("pg-query-stream")

                case "typeorm-aurora-data-api-driver":
                    return require("typeorm-aurora-data-api-driver")

                /**
                 * redis
                 */
                case "redis":
                    return require("redis")

                case "ioredis":
                    return require("ioredis")

                /**
                 * better-sqlite3
                 */
                case "better-sqlite3":
                    return require("better-sqlite3")

                /**
                 * sqlite
                 */
                case "sqlite3":
                    return require("sqlite3")

                /**
                 * sql.js
                 */
                case "sql.js":
                    return require("sql.js")

                /**
                 * sqlserver
                 */
                case "mssql":
                    return require("mssql")

                /**
                 * react-native-sqlite
                 */
                case "react-native-sqlite-storage":
                    return require("react-native-sqlite-storage")
            }
        } catch (err) {
            return require(path.resolve(
                process.cwd() + "/node_modules/" + name,
            ))
        }

        // If nothing above matched and we get here, the package was not listed within PlatformTools
        // and is an Invalid Package.  To make it explicit that this is NOT the intended use case for
        // PlatformTools.load - it's not just a way to replace `require` all willy-nilly - let's throw
        // an error.
        throw new TypeError(`Invalid Package for PlatformTools.load: ${name}`)
    }

    /**
     * Normalizes given path. Does "path.normalize" and replaces backslashes with forward slashes on Windows.
     */
    static pathNormalize(pathStr: string): string {
        let normalizedPath = path.normalize(pathStr)
        if (process.platform === "win32")
            normalizedPath = normalizedPath.replace(/\\/g, "/")
        return normalizedPath
    }

    /**
     * Gets file extension. Does "path.extname".
     */
    static pathExtname(pathStr: string): string {
        return path.extname(pathStr)
    }

    /**
     * Resolved given path. Does "path.resolve".
     */
    static pathResolve(pathStr: string): string {
        return path.resolve(pathStr)
    }

    /**
     * Synchronously checks if file exist. Does "fs.existsSync".
     */
    static fileExist(pathStr: string): boolean {
        return fs.existsSync(pathStr)
    }

    static readFileSync(filename: string): Buffer {
        return fs.readFileSync(filename)
    }

    static appendFileSync(filename: string, data: any): void {
        fs.appendFileSync(filename, data)
    }

    static async writeFile(path: string, data: any): Promise<void> {
        return new Promise<void>((ok, fail) => {
            fs.writeFile(path, data, (err) => {
                if (err) fail(err)
                ok()
            })
        })
    }

    /**
     * Loads a dotenv file into the environment variables.
     *
     * @param path The file to load as a dotenv configuration
     */
    static dotenv(pathStr: string): void {
        dotenv.config({ path: pathStr })
    }

    /**
     * Gets environment variable.
     */
    static getEnvVariable(name: string): any {
        return process.env[name]
    }

    /**
     * Highlights sql string to be print in the console.
     */
    static highlightSql(sql: string) {
        const theme: Theme = {
            keyword: chalk.blueBright,
            literal: chalk.blueBright,
            string: chalk.white,
            type: chalk.magentaBright,
            built_in: chalk.magentaBright,
            comment: chalk.gray,
        }
        return highlight(sql, { theme: theme, language: "sql" })
    }

    /**
     * Highlights json string to be print in the console.
     */
    static highlightJson(json: string) {
        return highlight(json, { language: "json" })
    }

    /**
     * Logging functions needed by AdvancedConsoleLogger
     */
    static logInfo(prefix: string, info: any) {
        console.log(chalk.gray.underline(prefix), info)
    }

    static logError(prefix: string, error: any) {
        console.log(chalk.underline.red(prefix), error)
    }

    static logWarn(prefix: string, warning: any) {
        console.log(chalk.underline.yellow(prefix), warning)
    }

    static log(message: string) {
        console.log(chalk.underline(message))
    }

    static info(info: any) {
        return chalk.gray(info)
    }

    static error(error: any) {
        return chalk.red(error)
    }

    static warn(message: string) {
        return chalk.yellow(message)
    }

    static logCmdErr(prefix: string, err?: any) {
        console.log(chalk.black.bgRed(prefix))
        if (err) console.error(err)
    }
}
