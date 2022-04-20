"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importJsonsFromDirectories = exports.importClassesFromDirectories = void 0;
var tslib_1 = require("tslib");
var glob_1 = tslib_1.__importDefault(require("glob"));
var PlatformTools_1 = require("../platform/PlatformTools");
var index_1 = require("../index");
/**
 * Loads all exported classes from the given directory.
 */
function importClassesFromDirectories(logger, directories, formats) {
    if (formats === void 0) { formats = [".js", ".cjs", ".ts"]; }
    var logLevel = "info";
    var classesNotFoundMessage = "No classes were found using the provided glob pattern: ";
    var classesFoundMessage = "All classes found using provided glob pattern";
    function loadFileClasses(exported, allLoaded) {
        if (typeof exported === "function" || exported instanceof index_1.EntitySchema) {
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
        return allDirs.concat(glob_1.default.sync(PlatformTools_1.PlatformTools.pathNormalize(dir)));
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
        return formats.indexOf(PlatformTools_1.PlatformTools.pathExtname(file)) !== -1 && dtsExtension !== ".d.ts";
    })
        .map(function (file) { return require(PlatformTools_1.PlatformTools.pathResolve(file)); });
    return loadFileClasses(dirs, []);
}
exports.importClassesFromDirectories = importClassesFromDirectories;
/**
 * Loads all json files from the given directory.
 */
function importJsonsFromDirectories(directories, format) {
    if (format === void 0) { format = ".json"; }
    var allFiles = directories.reduce(function (allDirs, dir) {
        return allDirs.concat(glob_1.default.sync(PlatformTools_1.PlatformTools.pathNormalize(dir)));
    }, []);
    return allFiles
        .filter(function (file) { return PlatformTools_1.PlatformTools.pathExtname(file) === format; })
        .map(function (file) { return require(PlatformTools_1.PlatformTools.pathResolve(file)); });
}
exports.importJsonsFromDirectories = importJsonsFromDirectories;

//# sourceMappingURL=DirectoryExportedClassesLoader.js.map
