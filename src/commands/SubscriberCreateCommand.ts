import * as yargs from "yargs"
import chalk from "chalk"
import path from "path"
import { PlatformTools } from "../platform/PlatformTools"
import { CommandUtils } from "./CommandUtils"

/**
 * Generates a new subscriber.
 */
export class SubscriberCreateCommand implements yargs.CommandModule {
    command = "subscriber:create <path>"
    describe = "Generates a new subscriber."

    builder(args: yargs.Argv) {
        return args.positional("path", {
            type: "string",
            describe: "Path of the subscriber file",
            demandOption: true,
        })
    }

    async handler(args: yargs.Arguments) {
        try {
            const fullPath = (args.path as string).startsWith("/")
                ? (args.path as string)
                : path.resolve(process.cwd(), args.path as string)
            const filename = path.basename(fullPath)
            const fileContent = SubscriberCreateCommand.getTemplate(filename)
            const fileExists = await CommandUtils.fileExists(fullPath + ".ts")
            if (fileExists) {
                throw `File ${chalk.blue(fullPath + ".ts")} already exists`
            }
            await CommandUtils.createFile(fullPath + ".ts", fileContent)
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
