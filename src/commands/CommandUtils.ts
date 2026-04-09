import fs from "fs/promises"
import path from "path"
import { TypeORMError } from "../error"
import type { DataSource } from "../data-source"
import { InstanceChecker } from "../util/InstanceChecker"
import { importOrRequireFile } from "../util/ImportUtils"
import { LoggerFactory } from "../logger/LoggerFactory"
import type { LoggerOptions } from "../logger/LoggerOptions"

/**
 * Command line utils functions.
 */
export class CommandUtils {
    static logDataSourceMessage(
        dataSource: Pick<DataSource, "options"> | undefined,
        message: string,
        loggerType:
            | "query"
            | "schema-build"
            | "migration"
            | "log"
            | "info"
            | "warn",
    ): boolean {
        if (!dataSource?.options.logger) {
            return false
        }

        const logger = new LoggerFactory().create(
            dataSource.options.logger,
            CommandUtils.getLoggerOptionsForCliMessage(loggerType),
        )

        switch (loggerType) {
            case "query":
                logger.logQuery(message)
                break

            case "schema-build":
                logger.logSchemaBuild(message)
                break

            case "migration":
                logger.logMigration(message)
                break

            case "log":
            case "info":
            case "warn":
                logger.log(loggerType, message)
                break
        }

        return true
    }

    static async loadDataSource(
        dataSourceFilePath: string,
    ): Promise<DataSource> {
        let dataSourceFileExports
        try {
            ;[dataSourceFileExports] =
                await importOrRequireFile(dataSourceFilePath)
        } catch (err) {
            throw new Error(
                `Unable to open file: "${dataSourceFilePath}". ${err.message}`,
                { cause: err },
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
     *
     * @param directory
     */
    static async createDirectories(directory: string): Promise<void> {
        await fs.mkdir(directory, { recursive: true })
    }

    /**
     * Creates a file with the given content in the given path.
     *
     * @param filePath
     * @param content
     * @param override
     */
    static async createFile(
        filePath: string,
        content: string,
        override: boolean = true,
    ): Promise<void> {
        await CommandUtils.createDirectories(path.dirname(filePath))
        if (override === false && (await CommandUtils.fileExists(filePath))) {
            return
        }
        await fs.writeFile(filePath, content)
    }

    /**
     * Reads everything from a given file and returns its content as a string.
     *
     * @param filePath
     */
    static async readFile(filePath: string): Promise<string> {
        const file = await fs.readFile(filePath)

        return file.toString()
    }

    static async fileExists(filePath: string) {
        try {
            await fs.access(filePath, fs.constants.F_OK)
            return true
        } catch {
            return false
        }
    }

    /**
     * Gets migration timestamp and validates argument (if sent)
     *
     * @param timestampOptionArgument
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

    private static getLoggerOptionsForCliMessage(
        loggerType:
            | "query"
            | "schema-build"
            | "migration"
            | "log"
            | "info"
            | "warn",
    ): LoggerOptions {
        switch (loggerType) {
            case "query":
                return ["query"]

            case "schema-build":
                return ["schema"]

            case "migration":
                return ["migration"]

            case "log":
            case "info":
            case "warn":
                return [loggerType]
        }
    }
}
