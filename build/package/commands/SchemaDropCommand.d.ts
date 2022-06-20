import * as yargs from "yargs";
/**
 * Drops all tables of the database from the given dataSource.
 */
export declare class SchemaDropCommand implements yargs.CommandModule {
    command: string;
    describe: string;
    builder(args: yargs.Argv): yargs.Argv<{
        dataSource: unknown;
    }>;
    handler(args: yargs.Arguments): Promise<void>;
}
