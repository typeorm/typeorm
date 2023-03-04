import * as yargs from "yargs"
import chalk from "chalk"
import path from "path"
import { PlatformTools } from "../platform/PlatformTools"
import { CommandUtils } from "./CommandUtils"

/**
 * Generates a new subscriber.
 */
export class SubscriberCreateCommand implements yargs.CommandModule {
    // Command name and description
    command = "subscriber:create <path>"
    describe = "Generates a new subscriber."

    // Handler function to be executed when command is called
    async handler(args: yargs.Arguments) {
        try {
            // Get the full path to the new file from the given path argument
            const fullPath = (args.path as string).startsWith("/")
                ? (args.path as string)
                : path.resolve(process.cwd(), args.path as string)
            const filename = path.basename(fullPath)
            // Generate the contents of the new file
            const fileContent = SubscriberCreateCommand.getTemplate(filename)
            // Check if the file already exists
            const fileExists = await CommandUtils.fileExists(fullPath + ".ts")
            if (fileExists) {
                throw `File ${chalk.blue(fullPath + ".ts")} already exists`
            }
            // Create the new file with the generated content
            await CommandUtils.createFile(fullPath + ".ts", fileContent)
            console.log(
                chalk.green(
                    `Subscriber ${chalk.blue(
                        fullPath,
                    )} has been created successfully.`,
                ),
            )
        } catch (err) {
            // If there was an error during file creation, log it and exit with error code 1
            PlatformTools.logCmdErr("Error during subscriber creation:")
            process.exit(1)
        }
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Gets contents of the entity file.
     * Generates the template for the new subscriber file.
     */
    protected static getTemplate(name: string): string {
        return `import { EventSubscriber, EntitySubscriberInterface } from "typeorm"

@EventSubscriber()
export class ${name} implements EntitySubscriberInterface {

}
`
    }
}
