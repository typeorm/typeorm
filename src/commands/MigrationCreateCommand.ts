import ansi from "ansis"
import path from "path"
import yargs from "yargs"
import { PlatformTools } from "../platform/PlatformTools"
import { camelCase } from "../util/StringUtils"
import { CommandUtils } from "./CommandUtils"

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
            .option("esm", {
                type: "boolean",
                default: false,
                describe:
                    "Generate a migration file on ESM instead of CommonJS",
            })
            .option("t", {
                alias: "timestamp",
                type: "number",
                default: false,
                describe: "Custom timestamp for the migration name",
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

            const fileContent = args.outputJs
                ? MigrationCreateCommand.getJavascriptTemplate(
                      filename,
                      timestamp,
                      args.esm,
                  )
                : MigrationCreateCommand.getTemplate(filename, timestamp)

            await CommandUtils.createFile(
                fullPath + (args.outputJs ? ".js" : ".ts"),
                fileContent,
            )
            console.log(
                `Migration ${ansi.blue(
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
        esm: boolean,
    ): string {
        const exportMethod = esm ? "export" : "module.exports ="
        return `/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
${exportMethod} class ${camelCase(name, true)}${timestamp} {

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
    }

}
`
    }
}
