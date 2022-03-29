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

    static async updateDataSourceFile({
        dataSourceFilePath,
        initializerName = "DataSource",
        initializerPropertyName,
        importedClassFilePath,
        importedClassExportName,
        importDefault,
        updateOtherRelevantFiles,
    }: {
        dataSourceFilePath: string
        initializerName?: string
        initializerPropertyName: "entities" | "migrations" | "subscribers"
        importedClassFilePath: string
        importedClassExportName: string
        importDefault: boolean
        updateOtherRelevantFiles: boolean
    }): Promise<string[]> {
        const dataSourceExtName = path.extname(dataSourceFilePath)
        const importedClassFileExtName = path.extname(importedClassFilePath)

        if (
            dataSourceExtName != ".ts" &&
            dataSourceExtName != ".cts" &&
            dataSourceExtName != ".mts"
        )
            return []

        if (
            importedClassFileExtName != ".ts" &&
            importedClassFileExtName != ".cts" &&
            importedClassFileExtName != ".mts"
        )
            return []

        // only try to import typescript when needed to avoid crashing the whole CLI when typescript isn't installed
        try {
            require("typescript")
        } catch (err) {
            throw new Error(
                `TypeScript is required in order to run this command. Please install it and try again.`,
            )
        }

        const {
            ImportAndAddItemToInitializerArrayPropertyInCodebase,
        } = require("../codebase-updater/ImportAndAddItemToInitializerArrayPropertyInCodebase")

        const codebaseUpdated =
            new ImportAndAddItemToInitializerArrayPropertyInCodebase({
                filePath: dataSourceFilePath,
                initializerName: initializerName,
                initializerPropertyName: initializerPropertyName,
                importedFilePath: importedClassFilePath,
                importedFileImportName: importedClassExportName,
                importedFileExportName: importedClassExportName,
                importDefault: importDefault,
                updateOtherRelevantFiles,
                treatImportNamespaceAsList: true,
                exportImportAllFromFileWhenImportingNamespace: true,
                treatObjectLiteralExpressionValuesAsList: true,
                instantiateObjectLiteralExpressionValuesByDefault: true,
            })
        return await codebaseUpdated.manipulateCodebase()
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
