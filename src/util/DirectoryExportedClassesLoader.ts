import {PlatformTools} from "../platform/PlatformTools";
import {EntitySchema} from "../index";

/**
 * Loads all exported classes from the given directory.
 */
export function importClassesFromDirectories(directories: string[], formats = [".js", ".ts"]): Function[] {

    function loadFileClasses(exported: any, allLoaded: Function[], visited: any[]) {

        // create a shallow copy of already visited exported properties
        visited = [...visited];

        if (typeof exported === "function" || exported instanceof EntitySchema) {
            allLoaded.push(exported);

        } else if (Array.isArray(exported)) {
            exported.forEach((i: any) => loadFileClasses(i, allLoaded, visited));

        } else if (typeof exported === "object" && exported !== null) {
            Object.keys(exported)
                .filter(key => !!~visited.indexOf(exported[key]))
                .forEach(key => {
                    visited.push(exported[key]);
                    loadFileClasses(exported[key], allLoaded, visited);
                });

        }
        return allLoaded;
    }

    const allFiles = directories.reduce((allDirs, dir) => {
        return allDirs.concat(PlatformTools.load("glob").sync(PlatformTools.pathNormalize(dir)));
    }, [] as string[]);

    const dirs = allFiles
        .filter(file => {
            const dtsExtension = file.substring(file.length - 5, file.length);
            return formats.indexOf(PlatformTools.pathExtname(file)) !== -1 && dtsExtension !== ".d.ts";
        })
        .map(file => PlatformTools.load(PlatformTools.pathResolve(file)));

    return loadFileClasses(dirs, [], []);
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
