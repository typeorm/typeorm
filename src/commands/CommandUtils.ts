import * as fs from "fs"
import * as path from "path"
import mkdirp from "mkdirp"
import { TypeORMError } from "../error"
import { DataSource } from "../data-source"
import { InstanceChecker } from "../util/InstanceChecker"
import { importOrRequireFile } from "../util/ImportUtils"

/**
 * Command line utils functions.
 */
export class CommandUtils {
    static async loadDataSource(
        dataSourceFilePath: string,
    ): Promise<DataSource> {
        let dataSourceFileExports
        try {
            ;[dataSourceFileExports] = await importOrRequireFile(
                dataSourceFilePath,
            )
        } catch (err) {
            throw new Error(
                `Unable to open file: "${dataSourceFilePath}". ${err.message}`,
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

        if (InstanceChecker.isDataSource(dataSourceFileExports)) {
            return dataSourceFileExports
        }

        const dataSourceExports = []
        for (const fileExportKey in dataSourceFileExports) {
            const fileExport = dataSourceFileExports[fileExportKey]
            // It is necessary to await here in case of the exported async value (Promise<DataSource>).
            // e.g. the DataSource is instantiated with an async factory in the source file
            // It is safe to await regardless of the export being async or not due to `awaits` definition:
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await#return_value
            const awaitedFileExport = await fileExport
            if (InstanceChecker.isDataSource(awaitedFileExport)) {
                dataSourceExports.push(awaitedFileExport)
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

    static getMigrationsDir(dataSource: DataSource): string {
        const migrations = dataSource.options.migrations

        if (Array.isArray(migrations)) {
            const migrationPath = migrations.find(
                (migration) => typeof migration === "string",
            )
            if (migrationPath) {
                if (migrationPath.startsWith("/")) {
                    return path.dirname(migrationPath as string)
                } else {
                    return path.resolve(
                        process.cwd(),
                        path.dirname(migrationPath as string),
                    )
                }
            }
        }

        return ""
    }
}
