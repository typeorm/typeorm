import * as yargs from "yargs";
/**
 * Generates a new entity.
 */
export declare class EntityCreateCommand implements yargs.CommandModule {
    command: string;
    describe: string;
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
     * Gets contents of the entity file.
     */
    protected static getTemplate(name: string): string;
}
