import path from "path";


export function getRelativeImportPath(containingFilePath: string, importedFilePath: string, moduleSystem: "esm" | "commonjs") {
    let relativePath = path.relative(path.dirname(containingFilePath), importedFilePath);

    const extName = path.extname(relativePath);

    const changeExtName = (newExt: string) =>
        relativePath = relativePath.slice(0, -extName.length) + newExt;

    if (extName === ".mts")
        changeExtName(".mjs");
    else if (extName === ".cts")
        changeExtName(".cjs");
    else if (extName === ".ts") {
        if (moduleSystem === "esm")
            changeExtName(".js");
        else
            changeExtName("");
    }

    relativePath = relativePath
        .split(path.sep)
        .join("/");

    if (!relativePath.startsWith("."))
        relativePath = "./" + relativePath;

    return relativePath;
}
