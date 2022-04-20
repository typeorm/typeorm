/**
 * Command line utils functions.
 */
export declare class CommandUtils {
    /**
     * Creates directories recursively.
     */
    static createDirectories(directory: string): Promise<string | undefined>;
    /**
     * Creates a file with the given content in the given path.
     */
    static createFile(filePath: string, content: string, override?: boolean): Promise<void>;
    /**
     * Reads everything from a given file and returns its content as a string.
     */
    static readFile(filePath: string): Promise<string>;
    static fileExists(filePath: string): Promise<boolean>;
}
