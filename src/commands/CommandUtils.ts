import * as fs from "fs"
import * as path from "path"
import mkdirp from "mkdirp"
import { TypeORMError } from "../error"
import { DataSource } from "../data-source"
import { InstanceChecker } from "../util/InstanceChecker"

/**
 * Command line utils functions.
 */
export class CommandUtils {
    static loadDataSource(dataSourceFilePath: string): DataSource {
        let dataSourceFileExports
        try {
            dataSourceFileExports = require(dataSourceFilePath)
        } catch (err) {
            throw new Error(
                `Invalid file path given: "${dataSourceFilePath}". File must contain a TypeScript / JavaScript code and export a DataSource instance.`,
            )
        }

        if (
            !dataSourceFileExports ||
            typeof dataSourceFileExports !== "object"
        ) {
            throw new Error(
                `Given data source file must contain export of a DataSource instance`,
            )
        }

        const dataSourceExports = []
        for (let fileExport in dataSourceFileExports) {
            if (
                InstanceChecker.isDataSource(dataSourceFileExports[fileExport])
            ) {
                dataSourceExports.push(dataSourceFileExports[fileExport])
            }
        }

        if (dataSourceExports.length === 0) {
            throw new Error(
                `Given data source file must contain export of a DataSource instance`,
            )
        }
        if (dataSourceExports.length > 1) {
            throw new Error(
                `Given data source file must contain only one export of DataSource instance`,
            )
        }
        return dataSourceExports[0]
    }

    /**
     * Creates directories recursively.
     */
    static createDirectories(directory: string) {
        return mkdirp(directory)
    }

    /**
     * Creates a file with the given content in the given path.
     */
    static async createFile(
        filePath: string,
        content: string,
        override: boolean = true,
    ): Promise<void> {
        await CommandUtils.createDirectories(path.dirname(filePath))
        return new Promise<void>((ok, fail) => {
            if (override === false && fs.existsSync(filePath)) return ok()

            fs.writeFile(filePath, content, (err) => (err ? fail(err) : ok()))
        })
    }

    /**
     * Reads everything from a given file and returns its content as a string.
     */
    static async readFile(filePath: string): Promise<string> {
        return new Promise<string>((ok, fail) => {
            fs.readFile(filePath, (err, data) =>
                err ? fail(err) : ok(data.toString()),
            )
        })
    }

    static async fileExists(filePath: string) {
        return fs.existsSync(filePath)
    }

    /**
     * Gets migration timestamp and validates argument (if sent)
     */
    static getTimestamp(timestampOptionArgument: any): number {
        if (
            timestampOptionArgument &&
            (isNaN(timestampOptionArgument) || timestampOptionArgument < 0)
        ) {
            throw new TypeORMError(
                `timestamp option should be a non-negative number. received: ${timestampOptionArgument}`,
            )
        }
        return timestampOptionArgument
            ? new Date(Number(timestampOptionArgument)).getTime()
            : Date.now()
    }
}
