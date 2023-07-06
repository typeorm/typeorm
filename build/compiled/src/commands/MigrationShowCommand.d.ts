import * as yargs from "yargs";
/**
 * Runs migration command.
 */
export declare class MigrationShowCommand implements yargs.CommandModule {
    command: string;
    describe: string;
    builder(args: yargs.Argv): yargs.Argv<{
        connection: string;
    } & {
        config: string;
    }>;
    handler(args: yargs.Arguments): Promise<void>;
}
