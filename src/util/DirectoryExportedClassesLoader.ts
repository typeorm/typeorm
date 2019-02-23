import {PlatformTools} from "../platform/PlatformTools";
import {EntitySchema} from "../index";

/**
 * Loads all exported classes from the given directory.
 */
export function importClassesFromDirectories(directories: string[], formats = [".js", ".ts"]): Function[] {

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

    const dirs = this.getAllDirs(directories, formats).map((file: string) => {
        PlatformTools.load(PlatformTools.pathResolve(file));
    });

    return loadFileClasses(dirs, []);
}

/**
 * Gets all files for given directory mask
 * @param directories array of directory path's
 * @param formats file extensions to filter out
 */
export function getAllDirs(
    directories: string[],
    formats = [".js", ".ts"]
): string[] {
    const allFiles = directories.reduce(
        (allDirs, dir) => {
            return allDirs.concat(
                PlatformTools.load("glob").sync(
                    PlatformTools.pathNormalize(dir)
                )
            );
        },
        [] as string[]
    );

    return allFiles
        .filter(file => {
            const dtsExtension = file.substring(file.length - 5, file.length);
            return (
                formats.indexOf(PlatformTools.pathExtname(file)) !== -1 &&
                dtsExtension !== ".d.ts"
            );
        });
}

/**
 * Loads all json files from the given directory.
 */
export function importJsonsFromDirectories(directories: string[], format = ".json"): any[] {

    const allFiles = directories.reduce((allDirs, dir) => {
        return allDirs.concat(PlatformTools.load("glob").sync(PlatformTools.pathNormalize(dir)));
    }, [] as string[]);

    return allFiles
        .filter(file => PlatformTools.pathExtname(file) === format)
        .map(file => PlatformTools.load(PlatformTools.pathResolve(file)));
}