import glob from "glob";
import { PlatformTools } from "../platform/PlatformTools";
import { EntitySchema } from "../index";
/**
 * Loads all exported classes from the given directory.
 */
export function importClassesFromDirectories(logger, directories, formats) {
    if (formats === void 0) { formats = [".js", ".cjs", ".ts"]; }
    var logLevel = "info";
    var classesNotFoundMessage = "No classes were found using the provided glob pattern: ";
    var classesFoundMessage = "All classes found using provided glob pattern";
    function loadFileClasses(exported, allLoaded) {
        if (typeof exported === "function" || exported instanceof EntitySchema) {
            allLoaded.push(exported);
        }
        else if (Array.isArray(exported)) {
            exported.forEach(function (i) { return loadFileClasses(i, allLoaded); });
        }
        else if (typeof exported === "object" && exported !== null) {
            Object.keys(exported).forEach(function (key) { return loadFileClasses(exported[key], allLoaded); });
        }
        return allLoaded;
    }
    var allFiles = directories.reduce(function (allDirs, dir) {
        return allDirs.concat(glob.sync(PlatformTools.pathNormalize(dir)));
    }, []);
    if (directories.length > 0 && allFiles.length === 0) {
        logger.log(logLevel, classesNotFoundMessage + " \"" + directories + "\"");
    }
    else if (allFiles.length > 0) {
        logger.log(logLevel, classesFoundMessage + " \"" + directories + "\" : \"" + allFiles + "\"");
    }
    var dirs = allFiles
        .filter(function (file) {
        var dtsExtension = file.substring(file.length - 5, file.length);
        return formats.indexOf(PlatformTools.pathExtname(file)) !== -1 && dtsExtension !== ".d.ts";
    })
        .map(function (file) { return require(PlatformTools.pathResolve(file)); });
    return loadFileClasses(dirs, []);
}
/**
 * Loads all json files from the given directory.
 */
export function importJsonsFromDirectories(directories, format) {
    if (format === void 0) { format = ".json"; }
    var allFiles = directories.reduce(function (allDirs, dir) {
        return allDirs.concat(glob.sync(PlatformTools.pathNormalize(dir)));
    }, []);
    return allFiles
        .filter(function (file) { return PlatformTools.pathExtname(file) === format; })
        .map(function (file) { return require(PlatformTools.pathResolve(file)); });
}

//# sourceMappingURL=DirectoryExportedClassesLoader.js.map
