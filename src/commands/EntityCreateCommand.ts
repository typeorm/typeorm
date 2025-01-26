import ansi from "ansis"
import path from "path"
import yargs from "yargs"
import { PlatformTools } from "../platform/PlatformTools"
import { CommandUtils } from "./CommandUtils"

/**
 * Generates a new entity.
 */
export class EntityCreateCommand implements yargs.CommandModule {
    command = "entity:create <path>"
    describe = "Generates a new entity."

    builder(args: yargs.Argv) {
        return args.positional("path", {
            type: "string",
            describe: "Path of the entity file",
            demandOption: true,
        })
    }

    async handler(args: yargs.Arguments) {
        try {
            const fullPath = (args.path as string).startsWith("/")
                ? (args.path as string)
                : path.resolve(process.cwd(), args.path as string)
            const filename = path.basename(fullPath)
            const fileContent = EntityCreateCommand.getTemplate(filename)
            const fileExists = await CommandUtils.fileExists(fullPath + ".ts")
            if (fileExists) {
                throw `File ${ansi.blue(fullPath + ".ts")} already exists`
            }
            await CommandUtils.createFile(fullPath + ".ts", fileContent)
            console.log(
                ansi.green(
                    `Entity ${ansi.blue(
                        fullPath + ".ts",
                    )} has been created successfully.`,
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
