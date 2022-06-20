/**
 * Dummy functions for replacement via `package.json` in browser builds.
 *
 * If we don't include these functions typeorm will throw an error on runtime
 * as well as during webpack builds.
 */
/**
 * Loads all exported classes from the given directory.
 */
export function importClassesFromDirectories(logger, directories, formats = [".js", ".cjs", ".ts"]) {
    return [];
}
/**
 * Loads all json files from the given directory.
 */
export function importJsonsFromDirectories(directories, format = ".json") {
    return [];
}

//# sourceMappingURL=BrowserDirectoryExportedClassesLoader.js.map
