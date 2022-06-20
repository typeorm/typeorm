import glob from "glob";
import { PlatformTools } from "../platform/PlatformTools";
import { importOrRequireFile } from "./ImportUtils";
import { ObjectUtils } from "./ObjectUtils";
import { InstanceChecker } from "./InstanceChecker";
/**
 * Loads all exported classes from the given directory.
 */
export async function importClassesFromDirectories(logger, directories, formats = [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]) {
    const logLevel = "info";
    const classesNotFoundMessage = "No classes were found using the provided glob pattern: ";
    const classesFoundMessage = "All classes found using provided glob pattern";
    function loadFileClasses(exported, allLoaded) {
        if (typeof exported === "function" ||
            InstanceChecker.isEntitySchema(exported)) {
            allLoaded.push(exported);
        }
        else if (Array.isArray(exported)) {
            exported.forEach((i) => loadFileClasses(i, allLoaded));
        }
        else if (ObjectUtils.isObject(exported)) {
            Object.keys(exported).forEach((key) => loadFileClasses(exported[key], allLoaded));
        }
        return allLoaded;
    }
    const allFiles = directories.reduce((allDirs, dir) => {
        return allDirs.concat(glob.sync(PlatformTools.pathNormalize(dir)));
    }, []);
    if (directories.length > 0 && allFiles.length === 0) {
        logger.log(logLevel, `${classesNotFoundMessage} "${directories}"`);
    }
    else if (allFiles.length > 0) {
        logger.log(logLevel, `${classesFoundMessage} "${directories}" : "${allFiles}"`);
    }
    const dirPromises = allFiles
        .filter((file) => {
        const dtsExtension = file.substring(file.length - 5, file.length);
        return (formats.indexOf(PlatformTools.pathExtname(file)) !== -1 &&
            dtsExtension !== ".d.ts");
    })
        .map(async (file) => {
        const [importOrRequireResult] = await importOrRequireFile(PlatformTools.pathResolve(file));
        return importOrRequireResult;
    });
    const dirs = await Promise.all(dirPromises);
    return loadFileClasses(dirs, []);
}
/**
 * Loads all json files from the given directory.
 */
export function importJsonsFromDirectories(directories, format = ".json") {
    const allFiles = directories.reduce((allDirs, dir) => {
        return allDirs.concat(glob.sync(PlatformTools.pathNormalize(dir)));
    }, []);
    return allFiles
        .filter((file) => PlatformTools.pathExtname(file) === format)
        .map((file) => require(PlatformTools.pathResolve(file)));
}

//# sourceMappingURL=DirectoryExportedClassesLoader.js.map
