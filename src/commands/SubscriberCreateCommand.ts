import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {CommandUtils} from "./CommandUtils";
const chalk = require("chalk");

/**
 * Generates a new subscriber.
 */
export class SubscriberCreateCommand {
    command = "subscriber:create";
    describe = "Generates a new subscriber.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which to run a query"
            })
            .option("n", {
                alias: "name",
                describe: "Name of the subscriber class.",
                demand: true
            })
            .option("d", {
                alias: "dir",
                describe: "Directory where subscriber should be created."
            })
            .option("f", {
                alias: "config",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(argv: any) {

        try {
            const fileContent = SubscriberCreateCommand.getTemplate(argv.name);
            const filename = argv.name + ".ts";
            let directory = argv.dir;

            // if directory is not set then try to open tsconfig and find default path there
            if (!directory) {
                try {
                    const connectionOptionsReader = new ConnectionOptionsReader({ root: process.cwd(), configName: argv.config });
                    const connectionOptions = await connectionOptionsReader.get(argv.connection);
                    directory = connectionOptions.cli ? connectionOptions.cli.subscribersDir : undefined;
                } catch (err) { }
            }

            const path = process.cwd() + "/" + (directory ? (directory + "/") : "") + filename;
            await CommandUtils.createFile(path, fileContent);
            console.log(chalk.green(`Subscriber ${chalk.blue(path)} has been created successfully.`));

        } catch (err) {
            console.log(chalk.black.bgRed("Error during subscriber creation:"));
            console.error(err);
            process.exit(1);
        }
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Gets contents of the entity file.
     */
    protected static getTemplate(name: string): string {
        return `import {EventSubscriber, EntitySubscriberInterface} from "typeorm";

@EventSubscriber()
export class ${name} implements EntitySubscriberInterface<any> {

}
`;
    }

}