import * as yargs from "yargs"
import chalk from "chalk"
import path from "path"
import { PlatformTools } from "../platform/PlatformTools"
import { CommandUtils } from "./CommandUtils"
import process from "process"

/**
 * Generates a new subscriber.
 */
export class SubscriberCreateCommand implements yargs.CommandModule {
    command = "subscriber:create <path>"
    describe = "Generates a new subscriber."

    builder(args: yargs.Argv) {
        return args
            .option("dataSource", {
                alias: "d",
                type: "string",
                describe:
                    "Path to the file where your DataSource instance is defined.",
            })
            .option("addImport", {
                alias: "a",
                type: "boolean",
                default: true,
                describe:
                    "Automatically add the generated subscriber to the DataSource file. true by default when dataSource is specified.",
            })
    }

    async handler(args: yargs.Arguments) {
        const dataSourceFilePath =
            args.dataSource == null
                ? null
                : path.resolve(process.cwd(), args.dataSource as string)

        try {
            if (dataSourceFilePath != null)
                await CommandUtils.loadDataSource(dataSourceFilePath)

            const fullPath = (args.path as string).startsWith("/")
                ? (args.path as string)
                : path.resolve(process.cwd(), args.path as string)
            const filename = path.basename(fullPath)
            const fileContent = SubscriberCreateCommand.getTemplate(filename)
            const subscriberFilePath = fullPath + ".ts"
            const fileExists = await CommandUtils.fileExists(subscriberFilePath)
            if (fileExists) {
                throw `File ${chalk.blue(subscriberFilePath)} already exists`
            }

            if (args.addImport && dataSourceFilePath != null) {
                const updatedFilePaths =
                    await CommandUtils.updateDataSourceFile({
                        dataSourceFilePath: dataSourceFilePath,
                        initializerPropertyName: "subscribers",
                        importedClassFilePath: subscriberFilePath,
                        importedClassExportName: filename,
                        importDefault: false,
                        updateOtherRelevantFiles: true,
                    })

                if (updatedFilePaths.length > 0) {
                    for (const filePath of updatedFilePaths)
                        console.log(
                            chalk.green(
                                `File ${chalk.blue(
                                    path.relative(process.cwd(), filePath),
                                )} has been updated`,
                            ),
                        )
                } else
                    console.warn(
                        chalk.yellow("DataSource file could not be updated"),
                    )
            }

            await CommandUtils.createFile(subscriberFilePath, fileContent)

            console.log(
                chalk.green(
                    `Subscriber ${chalk.blue(
                        fullPath,
                    )} has been created successfully.`,
                ),
            )
        } catch (err) {
            PlatformTools.logCmdErr("Error during subscriber creation:")
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
        return `import { EventSubscriber, EntitySubscriberInterface } from "typeorm"

@EventSubscriber()
export class ${name} implements EntitySubscriberInterface {

}
`
    }
}
