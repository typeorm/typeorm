import * as yargs from "yargs";
/**
 * Creates a new migration file.
 */
export declare class MigrationCreateCommand implements yargs.CommandModule {
    command: string;
    describe: string;
    aliases: string;
    builder(args: yargs.Argv): yargs.Argv<{
        c: string;
    } & {
        n: unknown;
    } & {
        d: unknown;
    } & {
        f: string;
    }>;
    handler(args: yargs.Arguments): Promise<void>;
    /**
     * Gets contents of the migration file.
     */
    protected static getTemplate(name: string, timestamp: number): string;
}
