import * as yargs from "yargs";
/**
 * Generates a new project with TypeORM.
 */
export declare class InitCommand implements yargs.CommandModule {
    command: string;
    describe: string;
    builder(args: yargs.Argv): yargs.Argv<{
        n: unknown;
    } & {
        db: unknown;
    } & {
        express: unknown;
    } & {
        docker: unknown;
    } & {
        pm: string;
    } & {
        ms: string;
    }>;
    handler(args: yargs.Arguments): Promise<void>;
    protected static executeCommand(command: string, cwd: string): Promise<string>;
    /**
     * Gets contents of the ormconfig file.
     */
    protected static getAppDataSourceTemplate(isEsm: boolean, database: string): string;
    /**
     * Gets contents of the ormconfig file.
     */
    protected static getTsConfigTemplate(esmModule: boolean): string;
    /**
     * Gets contents of the .gitignore file.
     */
    protected static getGitIgnoreFile(): string;
    /**
     * Gets contents of the user entity.
     */
    protected static getUserEntityTemplate(database: string): string;
    /**
     * Gets contents of the route file (used when express is enabled).
     */
    protected static getRoutesTemplate(isEsm: boolean): string;
    /**
     * Gets contents of the user controller file (used when express is enabled).
     */
    protected static getControllerTemplate(isEsm: boolean): string;
    /**
     * Gets contents of the main (index) application file.
     */
    protected static getAppIndexTemplate(express: boolean, isEsm: boolean): string;
    /**
     * Gets contents of the new package.json file.
     */
    protected static getPackageJsonTemplate(projectName?: string, projectIsEsm?: boolean): string;
    /**
     * Gets contents of the new docker-compose.yml file.
     */
    protected static getDockerComposeTemplate(database: string): string;
    /**
     * Gets contents of the new readme.md file.
     */
    protected static getReadmeTemplate(options: {
        docker: boolean;
    }): string;
    /**
     * Appends to a given package.json template everything needed.
     */
    protected static appendPackageJson(packageJsonContents: string, database: string, express: boolean, projectIsEsm: boolean): string;
}
