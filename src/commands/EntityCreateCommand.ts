import { CommandUtils } from "./CommandUtils"
import * as yargs from "yargs"
import chalk from "chalk"
import { PlatformTools } from "../platform/PlatformTools"
import path from "path"

/**
 * Generates a new entity.
 */
export class EntityCreateCommand implements yargs.CommandModule {
    command = "entity:create <path>"
    describe = "Generates a new entity."

    async handler(args: yargs.Arguments) {
        try {
            const fullPath = (args.path as string).startsWith("/")
                ? (args.path as string)
                : path.resolve(process.cwd(), args.path as string)
            const filename = path.basename(fullPath)
            const fileContent = EntityCreateCommand.getTemplate(filename)
            const fileExists = await CommandUtils.fileExists(fullPath + ".ts")
            if (fileExists) {
                throw `File ${chalk.blue(fullPath + ".ts")} already exists`
            }
            await CommandUtils.createFile(fullPath + ".ts", fileContent)
            console.log(
                chalk.green(
                    `Entity ${chalk.blue(
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
