import { highlight, Theme } from "cli-highlight";
import * as chalk from 'chalk';

/**
 * Platform-specific tools.
 */
export class PlatformTools {

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
        return highlight(sql, {theme: theme, language: "sql"});
    }

    /**
     * Highlights json string to be print in the console.
     */
    static highlightJson(json: string) {
        return highlight(json, {language: "json"});
    }

    /**
     * Logging functions needed by AdvancedConsoleLogger
     */
    static logInfo(prefix: string, info: any) {
        console.log(chalk.gray.underline(prefix), info);
    }

    static logError(prefix: string, error: any) {
        console.log(chalk.underline.red(prefix), error);
    }

    static logWarn(prefix: string, warning: any) {
        console.log(chalk.underline.yellow(prefix), warning);
    }

    static log(message: string) {
        console.log(chalk.underline(message));
    }

    static warn(message: string) {
        return chalk.yellow(message);
    }
}
