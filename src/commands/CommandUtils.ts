import * as fs from "fs";
import * as path from "path";
const mkdirp = require("mkdirp");

/**
 * Command line utils functions.
 */
export class CommandUtils {

    /**
     * Creates directories recursively.
     */
    static createDirectories(directory: string) {
        return new Promise((ok, fail) => mkdirp(directory, (err: any) => err ? fail(err) : ok()));
    }

    /**
     * Creates a file with the given content in the given path.
     */
    static async createFile(filePath: string, content: string): Promise<void> {
        await CommandUtils.createDirectories(path.dirname(filePath));
        return new Promise<void>((ok, fail) => {
            fs.writeFile(filePath, content, err => err ? fail(err) : ok());
        });
    }

}