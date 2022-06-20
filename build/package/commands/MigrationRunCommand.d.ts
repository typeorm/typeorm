import * as yargs from "yargs";
/**
 * Runs migration command.
 */
export declare class MigrationRunCommand implements yargs.CommandModule {
    command: string;
    describe: string;
    builder(args: yargs.Argv): yargs.Argv<{
        dataSource: unknown;
    } & {
        transaction: string;
    }>;
    handler(args: yargs.Arguments): Promise<void>;
}
