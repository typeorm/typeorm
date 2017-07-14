import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {CommandUtils} from "./CommandUtils";
import {Connection} from "../connection/Connection";
import {createConnection} from "../index";
import {MysqlDriver} from "../driver/mysql/MysqlDriver";
const mkdirp = require("mkdirp");
const chalk = require("chalk");

/**
 * Generates a new migration file with sql needs to be executed to update schema.
 */
export class MigrationGenerateCommand {

    command = "migrations:generate";
    describe = "Generates a new migration file with sql needs to be executed to update schema.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which run a query."
            })
            .option("n", {
                alias: "name",
                describe: "Name of the migration class.",
                demand: true
            })
            .option("d", {
                alias: "dir",
                describe: "Directory where migration should be created."
            })
            .option("cf", {
                alias: "config",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(argv: any) {
        const timestamp = new Date().getTime();
        const filename = timestamp + "-" + argv.name + ".ts";
        let directory = argv.dir;

        // if directory is not set then try to open tsconfig and find default path there
        if (!directory) {
            try {
                const connectionOptionsReader = new ConnectionOptionsReader({ root: process.cwd(), configName: argv.config });
                const connectionOptions = await connectionOptionsReader.get(argv.connection);
                directory = connectionOptions.cli ? connectionOptions.cli.migrationsDir : undefined;
            } catch (err) { }
        }

        let connection: Connection|undefined = undefined;
        try {
            const connectionOptionsReader = new ConnectionOptionsReader({ root: process.cwd(), configName: argv.config });
            const connectionOptions = await connectionOptionsReader.get(argv.connection);
            Object.assign(connectionOptions, {
                dropSchemaOnConnection: false,
                autoSchemaSync: false,
                autoMigrationsRun: false,
                logging: { logQueries: false, logFailedQueryError: false, logSchemaCreation: false }
            });
            connection = await createConnection(connectionOptions);
            const sqlQueries = await connection.logSyncSchema();
            const upSqls: string[] = [], downSqls: string[] = [];

            // mysql is exceptional here because it uses ` character in to escape names in queries, thats why for mysql
            // we are using simple quoted string instead of template string sytax
            if (connection.driver instanceof MysqlDriver) {
                sqlQueries.forEach(query => {
                    const queryString = typeof query === "string" ? query : query.up;
                    upSqls.push("        await queryRunner.query(\"" + queryString.replace(new RegExp(`"`, "g"), `\\"`) + "\");");
                    if (typeof query !== "string" && query.down)
                        downSqls.push("        await queryRunner.query(\"" + query.down.replace(new RegExp(`"`, "g"), `\\"`) + "\");");
                });
            } else {
                sqlQueries.forEach(query => {
                    const queryString = typeof query === "string" ? query : query.up;
                    upSqls.push("        await queryRunner.query(`" + queryString.replace(new RegExp("`", "g"), "\\`") + "`);");
                    if (typeof query !== "string" && query.down)
                        downSqls.push("        await queryRunner.query(`" + query.down.replace(new RegExp("`", "g"), "\\`") + "`);");
                });
            }
            const fileContent = MigrationGenerateCommand.getTemplate(argv.name, timestamp, upSqls, downSqls.reverse());
            const path = process.cwd() + "/" + (directory ? (directory + "/") : "") + filename;
            await CommandUtils.createFile(path, fileContent);

            if (upSqls.length) {
                console.log(chalk.green(`Migration ${chalk.blue(path)} has been generated successfully.`));

            } else {
                console.log(chalk.yellow(`No changes in database schema were found - cannot generate a migration. To create a new empty migration use "typeorm migrations:create" command`));
            }

        } catch (err) {
            console.log(chalk.black.bgRed("Error during migration generation:"));
            console.error(err);
            // throw err;

        } finally {
            if (connection)
                await connection.close();
        }
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Gets contents of the migration file.
     */
    protected static getTemplate(name: string, timestamp: number, upSqls: string[], downSqls: string[]): string {
        return `import {Connection, EntityManager, MigrationInterface, QueryRunner} from "typeorm";

export class ${name}${timestamp} implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
${upSqls.join(`
`)}
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
${downSqls.join(`
`)}
    }

}
`;
    }

}