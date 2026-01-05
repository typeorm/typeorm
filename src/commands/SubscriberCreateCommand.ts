import ansi from "ansis"
import path from "path"
import yargs from "yargs"
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
                throw new Error(`File "${fullPath}.ts" already exists`)
            }
            await CommandUtils.createFile(fullPath + ".ts", fileContent)
            console.log(
                ansi.green(
                    `Subscriber ${ansi.blue`${fullPath}.ts`} has been created successfully.`,
                ),
            )
        } catch (error) {
            PlatformTools.logCmdErr("Error during subscriber creation:", error)
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
