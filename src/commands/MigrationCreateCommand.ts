import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {CommandUtils} from "./CommandUtils";
const mkdirp = require("mkdirp");
const chalk = require("chalk");

/**
 * Creates a new migration file.
 */
export class MigrationCreateCommand {

    command = "migrations:create";
    describe = "Creates a new migration file.";

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
        try {
            const timestamp = new Date().getTime();
            const fileContent = MigrationCreateCommand.getTemplate(argv.name, timestamp);
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

            const path = process.cwd() + "/" + (directory ? (directory + "/") : "") + filename;
            await CommandUtils.createFile(path, fileContent);
            console.log(`Migration ${chalk.blue(path)} has been generated successfully.`);

        } catch (err) {
            console.log(chalk.black.bgRed("Error during migration creation:"));
            console.error(err);
        }
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Gets contents of the migration file.
     */
    protected static getTemplate(name: string, timestamp: number): string {
        return `import {Connection, EntityManager, MigrationInterface, QueryRunner} from "typeorm";

export class ${name}${timestamp} implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
    }

}
`;
    }

}