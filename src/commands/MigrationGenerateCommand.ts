import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {CommandUtils} from "./CommandUtils";
import {createConnection} from "../globals";
import {camelCase} from "../util/StringUtils";
import * as yargs from "yargs";
import chalk from "chalk";
import { format } from "@sqltools/formatter/lib/sqlFormatter";

/**
 * Generates a new migration file with sql needs to be executed to update schema.
 */
export class MigrationGenerateCommand implements yargs.CommandModule {

    command = "migration:generate";
    describe = "Generates a new migration file with sql needs to be executed to update schema.";
    aliases = "migrations:generate";

    builder(args: yargs.Argv) {
        return args
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which run a query."
            })
            .option("n", {
                alias: "name",
                describe: "Name of the migration class.",
                demand: true,
                type: "string"
            })
            .option("d", {
                alias: "dir",
                describe: "Directory where migration should be created."
            })
            .option("p", {
                alias: "pretty",
                type: "boolean",
                default: false,
                describe: "Pretty-print generated SQL",
            })
            .option("f", {
                alias: "config",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            })
            .option("o", {
                alias: "outputJs",
                type: "boolean",
                default: false,
                describe: "Generate a migration file on Javascript instead of Typescript",
            })
            .option("dr", {
                alias: "dryrun",
                type: "boolean",
                default: false,
                describe: "Prints out the contents of the migration instead of writing it to a file",
            })
            .option("ch", {
                alias: "check",
                type: "boolean",
                default: false,
                describe: "Verifies that the current database is up to date and that no migrations are needed. Otherwise exits with code 1.",
            })
            .option("t", {
                alias: "timestamp",
                type: "number",
                default: false,
                describe: "Custom timestamp for the migration name",
            });
    }

    async handler(args: yargs.Arguments) {
        if (args._[0] === "migrations:generate") {
            console.log("'migrations:generate' is deprecated, please use 'migration:generate' instead");
        }

        const timestamp = CommandUtils.getTimestamp(args.timestamp);
        const extension = args.outputJs ? ".js" : ".ts";
        const filename = timestamp + "-" + args.name + extension;
        let directory = args.dir as string | undefined;

        // if directory is not set then try to open tsconfig and find default path there
        if (!directory) {
            try {
                const connectionOptionsReader = new ConnectionOptionsReader({
                    root: process.cwd(),
                    configName: args.config as any
                });
                const connectionOptions = await connectionOptionsReader.get(args.connection as any);
                directory = connectionOptions.cli ? connectionOptions.cli.migrationsDir : undefined;
            } catch (err) { }
        }

        try {
            const connectionOptionsReader = new ConnectionOptionsReader({
                root: process.cwd(),
                configName: args.config as any
            });
            const connectionOptions = await connectionOptionsReader.get(args.connection as any);
            Object.assign(connectionOptions, {
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: false
            });

            const upSqls: string[] = [], downSqls: string[] = [];

            const connection = await createConnection(connectionOptions);
            try {
                const sqlInMemory = await connection.driver.createSchemaBuilder().log();

                if (args.pretty) {
                    sqlInMemory.upQueries.forEach(upQuery => {
                        upQuery.query = MigrationGenerateCommand.prettifyQuery(upQuery.query);
                    });
                    sqlInMemory.downQueries.forEach(downQuery => {
                        downQuery.query = MigrationGenerateCommand.prettifyQuery(downQuery.query);
                    });
                }

                sqlInMemory.upQueries.forEach(upQuery => {
                    upSqls.push("        await queryRunner.query(`" + upQuery.query.replace(new RegExp("`", "g"), "\\`") + "`" + MigrationGenerateCommand.queryParams(upQuery.parameters) + ");");
                });
                sqlInMemory.downQueries.forEach(downQuery => {
                    downSqls.push("        await queryRunner.query(`" + downQuery.query.replace(new RegExp("`", "g"), "\\`") + "`" + MigrationGenerateCommand.queryParams(downQuery.parameters) + ");");
                });
            } finally {
                await connection.close();
            }

            if (!upSqls.length) {
                if (args.check) {
                    console.log(chalk.green(`No changes in database schema were found`));
                    process.exit(0);
                } else {
                    console.log(chalk.yellow(`No changes in database schema were found - cannot generate a migration. To create a new empty migration use "typeorm migration:create" command`));
                    process.exit(1);
                }
            } else if (!args.name) {
                console.log(chalk.yellow("Please specify a migration name using the `-n` argument"));
                process.exit(1);
            }

            const fileContent = args.outputJs ?
                MigrationGenerateCommand.getJavascriptTemplate(args.name as any, timestamp, upSqls, downSqls.reverse()) :
                MigrationGenerateCommand.getTemplate(args.name as any, timestamp, upSqls, downSqls.reverse());
            if (directory && !directory.startsWith("/")) {
                directory = process.cwd() + "/" + directory;
            }
            const path = (directory ? (directory + "/") : "") + filename;

            if (args.check) {
                console.log(chalk.yellow(`Unexpected changes in database schema were found in check mode:\n\n${chalk.white(fileContent)}`));
                process.exit(1);
            }

            if (args.dryrun) {
                console.log(chalk.green(`Migration ${chalk.blue(path)} has content:\n\n${chalk.white(fileContent)}`));
            } else {
                await CommandUtils.createFile(path, fileContent);

                console.log(chalk.green(`Migration ${chalk.blue(path)} has been generated successfully.`));
            }
        } catch (err) {
            console.log(chalk.black.bgRed("Error during migration generation:"));
            console.error(err);
            process.exit(1);
        }
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Formats query parameters for migration queries if parameters actually exist
     */
    protected static queryParams(parameters: any[] | undefined): string {
      if (!parameters || !parameters.length) {
        return "";
      }

      return `, ${JSON.stringify(parameters)}`;
    }

    /**
     * Gets contents of the migration file.
     */
    protected static getTemplate(name: string, timestamp: number, upSqls: string[], downSqls: string[]): string {
        const migrationName = `${camelCase(name, true)}${timestamp}`;

        return `import {MigrationInterface, QueryRunner} from "typeorm";

export class ${migrationName} implements MigrationInterface {
    name = '${migrationName}'

    public async up(queryRunner: QueryRunner): Promise<void> {
${upSqls.join(`
`)}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
${downSqls.join(`
`)}
    }

}
`;
    }

    /**
     * Gets contents of the migration file in Javascript.
     */
    protected static getJavascriptTemplate(name: string, timestamp: number, upSqls: string[], downSqls: string[]): string {
        const migrationName = `${camelCase(name, true)}${timestamp}`;

        return `const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class ${migrationName} {
    name = '${migrationName}'

    async up(queryRunner) {
${upSqls.join(`
`)}
    }

    async down(queryRunner) {
${downSqls.join(`
`)}
    }
}
`;
    }

    /**
     *
     */
    protected static prettifyQuery(query: string) {
        const formattedQuery = format(query, { indent: "    " });
        return "\n" + formattedQuery.replace(/^/gm, "            ") + "\n        ";
    }
}
