import { CommandUtils } from "./CommandUtils"
import * as yargs from "yargs"
import chalk from "chalk"
import { PlatformTools } from "../platform/PlatformTools"
import path from "path"

/**
 * Generates a new entity.
 */
export class EntityCreateCommand implements yargs.CommandModule {
    // Command description and syntax definition
    command = "entity:create <path>"
    describe = "Generates a new entity."

    // Command handler
    async handler(args: yargs.Arguments) {
        try {
            // Determine the full path to the file to be created
            const fullPath = (args.path as string).startsWith("/")
                ? (args.path as string)
                : path.resolve(process.cwd(), args.path as string)
            // Extract the name of the entity from the file path
            const filename = path.basename(fullPath)
            // Generate the contents of the entity file using the template
            const fileContent = EntityCreateCommand.getTemplate(filename)
            // Check if the file already exists
            const fileExists = await CommandUtils.fileExists(fullPath + ".ts")
            if (fileExists) {
                throw `File ${chalk.blue(fullPath + ".ts")} already exists`
            }
            // Create the entity file
            await CommandUtils.createFile(fullPath + ".ts", fileContent)
            console.log(
                chalk.green(
                    `Entity ${chalk.blue(
                        fullPath + ".ts",
                    )} has been created successfully.`,
                ),
            )
        } catch (err) {
            // Log any errors that occur during entity creation
            PlatformTools.logCmdErr("Error during entity creation:", err)
            process.exit(1)
        }
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Gets contents of the entity file.
     * Uses a template string to generate the contents of the new entity file.
     * The name of the entity is passed in as a parameter.
     */
    protected static getTemplate(name: string): string {
        return `import { Entity } from "typeorm"

@Entity()
export class ${name} {

}
`
    }
}
