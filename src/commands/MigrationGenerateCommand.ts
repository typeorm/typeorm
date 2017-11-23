import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {CommandUtils} from "./CommandUtils";
import {Connection} from "../connection/Connection";
import {createConnection} from "../index";
import {MysqlDriver} from "../driver/mysql/MysqlDriver";

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
            .option("f", {
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
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: false
            });
            connection = await createConnection(connectionOptions);
            const sqlInMemory = await connection.driver.createSchemaBuilder().log();
            const upSqls: string[] = [], downSqls: string[] = [];

            // mysql is exceptional here because it uses ` character in to escape names in queries, thats why for mysql
            // we are using simple quoted string instead of template string sytax
            if (connection.driver instanceof MysqlDriver) {
                sqlInMemory.upQueries.forEach(query => {
                    upSqls.push("        await queryRunner.query(\"" + query.replace(new RegExp(`"`, "g"), `\\"`) + "\");");
                });
                sqlInMemory.downQueries.forEach(query => {
                    downSqls.push("        await queryRunner.query(\"" + query.replace(new RegExp(`"`, "g"), `\\"`) + "\");");
                });
            } else {
                sqlInMemory.upQueries.forEach(query => {
                    upSqls.push("        await queryRunner.query(`" + query.replace(new RegExp("`", "g"), "\\`") + "`);");
                });
                sqlInMemory.downQueries.forEach(query => {
                    downSqls.push("        await queryRunner.query(`" + query.replace(new RegExp("`", "g"), "\\`") + "`);");
                });
            }

            if (upSqls.length) {
                const fileContent = MigrationGenerateCommand.getTemplate(argv.name, timestamp, upSqls, downSqls.reverse());
                const path = process.cwd() + "/" + (directory ? (directory + "/") : "") + filename;
                await CommandUtils.createFile(path, fileContent);

                console.log(chalk.green(`Migration ${chalk.blue(path)} has been generated successfully.`));

            } else {
                console.log(chalk.yellow(`No changes in database schema were found - cannot generate a migration. To create a new empty migration use "typeorm migrations:create" command`));
            }
            await connection.close();

        } catch (err) {
            if (connection) await (connection as Connection).close();

            console.log(chalk.black.bgRed("Error during migration generation:"));
            console.error(err);
            process.exit(1);
        }
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Gets contents of the migration file.
     */
    protected static getTemplate(name: string, timestamp: number, upSqls: string[], downSqls: string[]): string {
        return `import {MigrationInterface, QueryRunner} from "typeorm";

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