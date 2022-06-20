import * as yargs from "yargs";
/**
 * Shows all migrations and whether they have been run or not.
 */
export declare class MigrationShowCommand implements yargs.CommandModule {
    command: string;
    describe: string;
    builder(args: yargs.Argv): yargs.Argv<{
        dataSource: unknown;
    }>;
    handler(args: yargs.Arguments): Promise<void>;
}
