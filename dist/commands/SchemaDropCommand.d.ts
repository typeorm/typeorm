import * as yargs from "yargs";
/**
 * Drops all tables of the database from the given connection.
 */
export declare class SchemaDropCommand implements yargs.CommandModule {
    command: string;
    describe: string;
    builder(args: yargs.Argv): yargs.Argv<{
        c: string;
    } & {
        f: string;
    }>;
    handler(args: yargs.Arguments): Promise<void>;
}
