import { CommandUtils } from "./CommandUtils"
import * as yargs from "yargs"
import chalk from "chalk"
import { PlatformTools } from "../platform/PlatformTools"
import path from "path"
import process from "process"

/**
 * Generates a new entity.
 */
export class EntityCreateCommand implements yargs.CommandModule {
    command = "entity:create <path>"
    describe = "Generates a new entity."

    builder(args: yargs.Argv) {
        return args
            .option("dataSource", {
                alias: "d",
                type: "string",
                describe:
                    "Path to the file where your DataSource instance is defined."
            })
            .option("addImport", {
                alias: "a",
                type: "boolean",
                default: true,
                describe:
                    "Automatically add the generated entity to the DataSource file. true by default when dataSource is specified."
            })
    }

    async handler(args: yargs.Arguments) {
        const dataSourceFilePath = args.dataSource == null ? null : path.resolve(process.cwd(), args.dataSource as string);

        try {
            if (dataSourceFilePath != null)
                await CommandUtils.loadDataSource(dataSourceFilePath)

            const fullPath = (args.path as string).startsWith("/")
                ? (args.path as string)
                : path.resolve(process.cwd(), args.path as string)
            const filename = path.basename(fullPath)
            const fileContent = EntityCreateCommand.getTemplate(filename)
            const entityFilePath = fullPath + ".ts"
            const fileExists = await CommandUtils.fileExists(entityFilePath)
            if (fileExists) {
                throw `File ${chalk.blue(entityFilePath)} already exists`
            }

            if (args.addImport && dataSourceFilePath != null) {
                const dataSourceFileUpdated = await CommandUtils.updateDataSourceFile({
                    dataSourceFilePath: dataSourceFilePath,
                    initializerPropertyName: "entities",
                    importedClassFilePath: entityFilePath,
                    importedClassExportName: filename,
                    importDefault: false
                });

                if (!dataSourceFileUpdated)
                    console.warn(chalk.yellow("DataSource file could not be updated"));
            }

            await CommandUtils.createFile(entityFilePath, fileContent)

            console.log(
                chalk.green(
                    `Entity ${chalk.blue(entityFilePath)} has been created successfully.`,
                ),
            )
        } catch (err) {
            PlatformTools.logCmdErr("Error during entity creation:", err)
            process.exit(1)
        }
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Gets contents of the entity file.
     */
    protected static getTemplate(name: string): string {
        return `import { Entity } from "typeorm"

@Entity()
export class ${name} {

}
`
    }
}
