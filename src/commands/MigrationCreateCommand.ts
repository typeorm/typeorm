import { CommandUtils } from "./CommandUtils"
import { camelCase } from "../util/StringUtils"
import * as yargs from "yargs"
import chalk from "chalk"
import { PlatformTools } from "../platform/PlatformTools"
import path from "path"
import process from "process"

/**
 * Creates a new migration file.
 */
export class MigrationCreateCommand implements yargs.CommandModule {
    command = "migration:create <path>"
    describe = "Creates a new migration file."

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
                    "Automatically add the generated migration to the DataSource file. true by default when dataSource is specified."
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
    }

    async handler(args: yargs.Arguments) {
        const dataSourceFilePath = args.dataSource == null ? null : path.resolve(process.cwd(), args.dataSource as string);

        try {
            if (dataSourceFilePath != null)
                await CommandUtils.loadDataSource(dataSourceFilePath)

            const timestamp = CommandUtils.getTimestamp(args.timestamp)
            const fullPath = (args.path as string).startsWith("/")
                ? (args.path as string)
                : path.resolve(process.cwd(), args.path as string)
            const filename = path.basename(fullPath)
            const migrationFilePath = fullPath + (args.outputJs ? ".js" : ".ts");

            const migrationName = `${camelCase(filename, true)}${timestamp}`;
            const fileContent = args.outputJs
                ? MigrationCreateCommand.getJavascriptTemplate(migrationName)
                : MigrationCreateCommand.getTemplate(migrationName)

            if (!args.outputJs && args.addImport && dataSourceFilePath != null) {
                const dataSourceFileUpdated = await CommandUtils.updateDataSourceFile({
                    dataSourceFilePath: dataSourceFilePath,
                    initializerPropertyName: "migrations",
                    importedClassFilePath: migrationFilePath,
                    importedClassExportName: migrationName,
                    importDefault: false
                });

                if (!dataSourceFileUpdated)
                    console.warn(chalk.yellow("DataSource file could not be updated"));
            }

            await CommandUtils.createFile(migrationFilePath, fileContent)
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
    protected static getTemplate(migrationName: string): string {
        return `import { MigrationInterface, QueryRunner } from "typeorm"

export class ${migrationName} implements MigrationInterface {

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
    protected static getJavascriptTemplate(migrationName: string): string {
        return `const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class ${migrationName} {

    async up(queryRunner) {
    }

    async down(queryRunner) {
    }

}
`
    }
}
