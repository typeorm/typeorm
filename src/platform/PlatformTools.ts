import * as path from "path";
import * as fs from "fs";
import {highlight, Theme} from "cli-highlight";
const chalk = require("chalk");

/**
 * Platform-specific tools.
 */
export class PlatformTools {

    /**
     * Type of the currently running platform.
     */
    static type: "browser"|"node" = "node";

    /**
     * Gets global variable where global stuff can be stored.
     */
    static getGlobalVariable(): any {
        return global;
    }

    /**
     * Loads ("require"-s) given file or package.
     * This operation only supports on node platform
     */
    static load(name: string): any {

        // if name is not absolute or relative, then try to load package from the node_modules of the directory we are currenly in
        // this is useful when we are using typeorm package globally installed and it accesses drivers
        // that are not installed globally

        try {
            return require(name);

        } catch (err) {
            if (!path.isAbsolute(name) && name.substr(0, 2) !== "./" && name.substr(0, 3) !== "../") {
                return require(path.resolve(process.cwd() + "/node_modules/" + name));
            }

            throw err;
        }
    }

    /**
     * Normalizes given path. Does "path.normalize".
     */
    static pathNormilize(pathStr: string): string {
        return path.normalize(pathStr);
    }

    /**
     * Gets file extension. Does "path.extname".
     */
    static pathExtname(pathStr: string): string {
        return path.extname(pathStr);
    }

    /**
     * Resolved given path. Does "path.resolve".
     */
    static pathResolve(pathStr: string): string {
        return path.resolve(pathStr);
    }

    /**
     * Synchronously checks if file exist. Does "fs.existsSync".
     */
    static fileExist(pathStr: string): boolean {
        return fs.existsSync(pathStr);
    }

    /**
     * Gets environment variable.
     */
    static getEnvVariable(name: string): any {
        return process.env[name];
    }

    /**
     * Highlights sql string to be print in the console.
     */
    static highlightSql(sql: string) {
        const theme: Theme = {
            "keyword": chalk.blueBright,
            "literal": chalk.blueBright,
            "string": chalk.white,
            "type": chalk.magentaBright,
            "built_in": chalk.magentaBright,
            "comment": chalk.gray,
        };
        return highlight(sql, { theme: theme, language: "sql" });
    }

    /**
     * Highlights json string to be print in the console.
     */
    static highlightJson(json: string) {
        return highlight(json, { language: "json" });
    }

}