import { EntitySchema, Logger } from "@typeorm/browser-core";
import { sync } from 'glob';
import { extname, normalize, resolve } from 'path';

/**
 * Loads all exported classes from the given directory.
 */
export function importClassesFromDirectories(logger: Logger, directories: string[], formats = [".js", ".ts"]): Function[] {

    const logLevel = "info";
    const classesNotFoundMessage = "No classes were found using the provided glob pattern: ";
    const classesFoundMessage = "All classes found using provided glob pattern";

    function loadFileClasses(exported: any, allLoaded: Function[]) {
        if (typeof exported === "function" || exported instanceof EntitySchema) {
            allLoaded.push(exported);

        } else if (Array.isArray(exported)) {
            exported.forEach((i: any) => loadFileClasses(i, allLoaded));

        } else if (typeof exported === "object" && exported !== null) {
            Object.keys(exported).forEach(key => loadFileClasses(exported[key], allLoaded));

        }
        return allLoaded;
    }

    const allFiles = directories.reduce((allDirs, dir) => {
        return allDirs.concat(sync(normalize(dir)));
    }, [] as string[]);

    if (directories.length > 0 && allFiles.length === 0) {
        logger.log(logLevel, `${classesNotFoundMessage} "${directories}"`);
    } else if (allFiles.length > 0) {
        logger.log(logLevel, `${classesFoundMessage} "${directories}" : "${allFiles}"`);
    }
    const dirs = allFiles
        .filter(file => {
            const dtsExtension = file.substring(file.length - 5, file.length);
            return formats.indexOf(extname(file)) !== -1 && dtsExtension !== ".d.ts";
        })
        .map(file => require(resolve(file)));

    return loadFileClasses(dirs, []);
}

/**
 * Loads all json files from the given directory.
 */
export function importJsonsFromDirectories(directories: string[], format = ".json"): any[] {

    const allFiles = directories.reduce((allDirs, dir) => {
        return allDirs.concat(sync(normalize(dir)));
    }, [] as string[]);

    return allFiles
        .filter(file => extname(file) === format)
        .map(file => require(resolve(file)));
}
