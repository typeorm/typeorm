import * as yargs from "yargs";
/**
 * Generates a new migration file with sql needs to be executed to update schema.
 */
export declare class MigrationGenerateCommand implements yargs.CommandModule {
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
    protected static getTemplate(name: string, timestamp: number, upSqls: string[], downSqls: string[]): string;
}
