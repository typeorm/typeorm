import * as yargs from "yargs";
/**
 * Shows typeorm version.
 */
export declare class VersionCommand implements yargs.CommandModule {
    command: string;
    describe: string;
    handler(): Promise<void>;
    protected static executeCommand(command: string): Promise<string>;
}
