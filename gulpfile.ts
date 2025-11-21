import path from "path";
import fs from "fs/promises";
import { spawn } from "child_process";
import gulp from "gulp";
import rename from "gulp-rename";
import { glob } from "glob";
import { rimraf } from "rimraf";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const buildDir = "./build";
const packageDir = `${buildDir}/package`;
const browserSrcDir = `${buildDir}/browser/src`;

type SpawnOptions = Parameters<typeof spawn>[2];

const runCommand = (command: string, args: string[], options: SpawnOptions = {}) =>
    new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: "inherit",
            shell: false,
            ...options,
        });

        child.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
            }
        });

        child.on("error", reject);
    });

const ensureDir = (dir: string) => fs.mkdir(dir, { recursive: true });

// -------------------------------------------------------------------------
// General tasks
// -------------------------------------------------------------------------

/**
 * Cleans build folder.
 */
export const clean = async () => rimraf(["./build/**"], { glob: true });

/**
 * Runs typescript files compilation.
 */
export const compile = () => runCommand(npmCommand, ["run", "compile"]);

// -------------------------------------------------------------------------
// Build and packaging for browser
// -------------------------------------------------------------------------

/**
 * Copies all source files into destination folder in a correct structure.
 */
export const browserCopySources = () =>
    gulp.src([
        "./src/**/*.ts",
        "!./src/commands/*.ts",
        "!./src/cli.ts",
        "!./src/typeorm.ts",
        "!./src/typeorm-model-shim.ts"
    ])
        .pipe(gulp.dest(browserSrcDir));

/**
 * Copies templates for compilation.
 */
export const browserCopyTemplates = () =>
    gulp.src("./src/platform/*.template")
        .pipe(rename((p) => { p.extname = ".ts"; }))
        .pipe(gulp.dest(`${browserSrcDir}/platform`));

export const browserCompile = () =>
    runCommand(npxCommand, ["tsc", "-p", "tsconfig.browser.json"]);

export const browserClearWorkDirectory = async () =>
    rimraf(["./build/browser/**"], { glob: true });

// -------------------------------------------------------------------------
// Main Packaging and Publishing tasks
// -------------------------------------------------------------------------

/**
 * Publishes a package to npm from ./build/package directory.
 */
export const packagePublish = () =>
    runCommand(npmCommand, ["publish"], { cwd: packageDir });

/**
 * Packs a .tgz from ./build/package directory.
 */
export const packagePack = async () => {
    await runCommand(npmCommand, ["pack"], { cwd: packageDir });
    const archives = await glob("typeorm-*.tgz", { cwd: packageDir, absolute: true });

    if (!archives.length) {
        throw new Error("npm pack did not create any archives.");
    }

    const latestArchive = archives.sort().at(-1)!;
    const destination = path.join(buildDir, path.basename(latestArchive));

    await fs.rm(destination, { force: true });
    await fs.rename(latestArchive, destination);
};

/**
 * Publishes a package to npm from ./build/package directory with @next tag.
 */
export const packagePublishNext = () =>
    runCommand(npmCommand, ["publish", "--tag", "next"], { cwd: packageDir });

/**
 * Copies all sources to the package directory.
 */
export const packageCompile = () =>
    runCommand(npxCommand, ["tsc", "-p", "tsconfig.package.json"]);

/**
 * Moves all compiled files to the final package directory.
 */
export const packageMoveCompiledFiles = () =>
    gulp.src("./build/package/src/**/*")
        .pipe(gulp.dest("./build/package"));

/**
 * Create ESM index file in the final package directory.
 */
export const packageCreateEsmIndex = async () => {
    const indexPath = path.resolve(packageDir, "index.js");
    const cjsModule = await import(indexPath);
    const cjsIndex = (cjsModule.default ?? cjsModule) as Record<string, unknown>;
    const cjsKeys = Object.keys(cjsIndex).filter((key) => key !== "default" && !key.startsWith("__"));

    const indexMjsContent =
        'import TypeORM from "./index.js";\n' +
        `const {\n    ${cjsKeys.join(",\n    ")}\n} = TypeORM;\n` +
        `export {\n    ${cjsKeys.join(",\n    ")}\n};\n` +
        "export default TypeORM;\n";

    await fs.writeFile(path.join(packageDir, "index.mjs"), indexMjsContent, "utf8");
};

/**
 * Removes /// <reference from compiled sources.
 */
export const packageReplaceReferences = async () => {
    const files = await glob("**/*.d.ts", { cwd: packageDir, absolute: true });

    await Promise.all(files.map(async (file) => {
        const content = await fs.readFile(file, "utf8");
        const updated = content
            .replace(/\/\/\/ <reference types="node" \/>/g, "")
            .replace(/\/\/\/ <reference types="chai" \/>/g, "");

        if (updated !== content) {
            await fs.writeFile(file, updated, "utf8");
        }
    }));
};

/**
 * Clears the temporary package/src directory.
 */
export const packageClearPackageDirectory = async () =>
    rimraf(["build/package/src/**"], { glob: true });

/**
 * Change the "private" state of the packaged package.json file to public.
 */
export const packagePreparePackageFile = async () => {
    const pkg = JSON.parse(await fs.readFile("./package.json", "utf8"));
    pkg.private = false;

    await ensureDir(packageDir);
    await fs.writeFile(path.join(packageDir, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
};

/**
 * Copies README.md into the package.
 */
export const packageCopyReadme = async () => {
    const readme = await fs.readFile("./README.md", "utf8");
    const updated = readme.replace(/```typescript([\s\S]*?)```/g, "```javascript$1```");

    await ensureDir(packageDir);
    await fs.writeFile(path.join(packageDir, "README.md"), updated, "utf8");
};

/**
 * Copies shims to use typeorm in different environments.
 */
export const packageCopyShims = async () => {
    const shims = [
        "./extra/typeorm-model-shim.js",
        "./extra/typeorm-class-transformer-shim.js",
    ];

    await ensureDir(packageDir);

    await Promise.all(shims.map(async (file) => {
        const destination = path.join(packageDir, path.basename(file));
        await fs.copyFile(file, destination);
    }));
};

/**
 * Move reference to package.json one level up.
 */
export const movePackageJsonReferenceLevelUp = async () => {
    const target = path.join(packageDir, "commands/InitCommand.js");

    try {
        const content = await fs.readFile(target, "utf8");
        const updated = content.replace(/\.\.\/package.json/g, "package.json");

        if (updated !== content) {
            await fs.writeFile(target, updated, "utf8");
        }
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error;
        }
    }
};

/**
 * Creates a package that can be published to npm.
 */
const packageTask = gulp.series(
    clean,
    gulp.parallel(browserCopySources, browserCopyTemplates),
    gulp.parallel(packageCompile, browserCompile),
    packageMoveCompiledFiles,
    packageCreateEsmIndex,
    gulp.parallel(
        browserClearWorkDirectory,
        packageReplaceReferences,
        packagePreparePackageFile,
        packageCopyReadme,
        packageCopyShims,
        movePackageJsonReferenceLevelUp
    ),
    packageClearPackageDirectory
);

/**
 * Creates a package .tgz.
 */
const packTask = gulp.series(packageTask, packagePack);

/**
 * Creates a package and publishes it to npm.
 */
const publishTask = gulp.series(packageTask, packagePublish);

/**
 * Creates a package and publishes it to npm with @next tag.
 */
const publishNextTask = gulp.series(packageTask, packagePublishNext);

packTask.displayName = "pack";
publishTask.displayName = "publish";
publishNextTask.displayName = "publish-next";

gulp.task("package", packageTask);
gulp.task("pack", packTask);
gulp.task("publish", publishTask);
gulp.task("publish-next", publishNextTask);

export { packageTask as package };
export const pack = packTask;
export const publish = publishTask;
export const publishNext = publishNextTask;
