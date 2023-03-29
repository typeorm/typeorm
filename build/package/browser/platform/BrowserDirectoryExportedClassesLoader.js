/**
 * Dummy functions for replacement via `package.json` in browser builds.
 *
 * If we don't include these functions typeorm will throw an error on runtime
 * as well as during webpack builds.
 */
/**
 * Loads all exported classes from the given directory.
 */
export function importClassesFromDirectories(logger, directories, formats) {
    if (formats === void 0) { formats = [".js", ".cjs", ".ts"]; }
    return [];
}
/**
 * Loads all json files from the given directory.
 */
export function importJsonsFromDirectories(directories, format) {
    if (format === void 0) { format = ".json"; }
    return [];
}

//# sourceMappingURL=BrowserDirectoryExportedClassesLoader.js.map
