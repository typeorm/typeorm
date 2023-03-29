import { Logger } from "../logger/Logger";
/**
 * Loads all exported classes from the given directory.
 */
export declare function importClassesFromDirectories(logger: Logger, directories: string[], formats?: string[]): Function[];
/**
 * Loads all json files from the given directory.
 */
export declare function importJsonsFromDirectories(directories: string[], format?: string): any[];
