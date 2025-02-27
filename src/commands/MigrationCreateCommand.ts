import { CommandUtils } from "./CommandUtils"
import { camelCase } from "../util/StringUtils"
import * as yargs from "yargs"
import chalk from "chalk"
import { PlatformTools } from "../platform/PlatformTools"
import path from "path"

/**
 * Creates a new migration file.
 */
export class MigrationCreateCommand implements yargs.CommandModule {
    command = "migration:create <path>"
    describe = "Creates a new migration file."

    builder(args: yargs.Argv) {
        return args
            .positional("path", {
                type: "string",
                describe: "Path of the migration file",
                demandOption: true,
            })
            .option("o", {
                alias: "outputJs",
                type: "boolean",
                default: false,
                describe:
                    "Generate a migration file on Javascript instead of Typescript",
            })
            .option("t", {
                alias: "timestamp",
                type: "number",
                default: false,
                describe: "Custom timestamp for the migration name",
            })
            .option("tmp", {
                alias: "template",
                type: "string",
                default: false,
                describe: "Template for the migration file",
            })
    }

    async handler(args: yargs.Arguments<any & { path: string }>) {
        try {
            const timestamp = CommandUtils.getTimestamp(args.timestamp)
            const inputPath = args.path.startsWith("/")
                ? args.path
                : path.resolve(process.cwd(), args.path)
            const filename = path.basename(inputPath)
            const fullPath =
                path.dirname(inputPath) + "/" + timestamp + "-" + filename

            const fileContent = args.template
                ? (await CommandUtils.readFile(args.template)).replace(
                      /\$ClassName/g,
                      `${camelCase(filename, true)}${timestamp}`,
                  )
                : args.outputJs
                ? MigrationCreateCommand.getJavascriptTemplate(
                      filename,
                      timestamp,
                  )
                : MigrationCreateCommand.getTemplate(filename, timestamp)

            await CommandUtils.createFile(
                fullPath + (args.outputJs ? ".js" : ".ts"),
                fileContent,
            )
            console.log(
                `Migration ${chalk.blue(
                    fullPath + (args.outputJs ? ".js" : ".ts"),
                )} has been generated successfully.`,
            )
        } catch (err) {
            PlatformTools.logCmdErr("Error during migration creation:", err)
            process.exit(1)
        }
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Gets contents of the migration file.
     */
    protected static getTemplate(name: string, timestamp: number): string {
        return `import { MigrationInterface, QueryRunner } from "typeorm";

export class ${camelCase(
            name,
            true,
        )}${timestamp} implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
`
    }

    /**
     * Gets contents of the migration file in Javascript.
     */
    protected static getJavascriptTemplate(
        name: string,
        timestamp: number,
    ): string {
        return `const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class ${camelCase(name, true)}${timestamp} {

    async up(queryRunner) {
    }

    async down(queryRunner) {
    }

}
`
    }
}
