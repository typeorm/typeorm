import * as yargs from "yargs";
/**
 * Executes an SQL query on the given dataSource.
 */
export declare class QueryCommand implements yargs.CommandModule {
    command: string;
    describe: string;
    builder(args: yargs.Argv): yargs.Argv<{
        query: string | undefined;
    } & {
        dataSource: unknown;
    }>;
    handler(args: yargs.Arguments): Promise<void>;
}
