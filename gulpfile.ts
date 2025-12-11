import fs from "fs/promises";
import gulp from "gulp";
import rename from "gulp-rename";
import replace from "gulp-replace";
import shell from "gulp-shell";
import sourcemaps from "gulp-sourcemaps";
import ts from "gulp-typescript";
import { Gulpclass, MergedTask, SequenceTask, Task } from "gulpclass";
import { rimraf } from "rimraf";

@Gulpclass()
export class Gulpfile {

    // -------------------------------------------------------------------------
    // General tasks
    // -------------------------------------------------------------------------

    /**
     * Cleans build folder.
     */
    @Task()
    async clean() {
        return rimraf(["./build/**"], { glob: true });
    }

    /**
     * Runs typescript files compilation.
     */
    @Task()
    compile() {
        return gulp.src("package.json", { read: false })
            .pipe(shell(["npm run compile"]));
    }

    // -------------------------------------------------------------------------
    // Build and packaging for browser
    // -------------------------------------------------------------------------

    /**
     * Copies all source files into destination folder in a correct structure.
     */
    @Task()
    browserCopySources() {
        return gulp.src([
            "./src/**/*.ts",
            "!./src/commands/*.ts",
            "!./src/cli.ts",
            "!./src/typeorm.ts",
            "!./src/typeorm-model-shim.ts"
        ])
        .pipe(gulp.dest("./build/browser/src"));
    }

    /**
     * Copies templates for compilation
     */
    @Task()
    browserCopyTemplates() {
        return gulp.src("./src/platform/*.template")
            .pipe(rename((p) => { p.extname = '.ts'; }))
            .pipe(gulp.dest("./build/browser/src/platform"));
    }

    @MergedTask()
    browserCompile() {
        const tsProject = ts.createProject("tsconfig.json", {
            lib: ["es2023", "dom"],
            typescript: require("typescript")
        });
        const tsResult = gulp.src([
            "./build/browser/src/**/*.ts",
            "./node_modules/reflect-metadata/**/*.d.ts"
        ])
            .pipe(sourcemaps.init())
            .pipe(tsProject());

        return [
            tsResult.dts.pipe(gulp.dest("./build/package/browser")),
            tsResult.js
                .pipe(sourcemaps.write(".", { sourceRoot: "", includeContent: true }))
                .pipe(gulp.dest("./build/package/browser"))
        ];
    }

    @Task()
    async browserClearPackageDirectory() {
        return rimraf([
            "./build/browser/**"
        ], { glob: true });
    }

    // -------------------------------------------------------------------------
    // Main Packaging and Publishing tasks
    // -------------------------------------------------------------------------

    /**
     * Publishes a package to npm from ./build/package directory.
     */
    @Task()
    packagePublish() {
        return gulp.src("package.json", { read: false })
            .pipe(shell([
                "cd ./build/package && npm publish"
            ]));
    }

    /**
     * Packs a .tgz from ./build/package directory.
     */
    @Task()
    packagePack() {
        return gulp.src("package.json", { read: false })
            .pipe(shell([
                "cd ./build/package && npm pack && mv -f typeorm-*.tgz .."
            ]));
    }

    /**
     * Publishes a package to npm from ./build/package directory with @next tag.
     */
    @Task()
    packagePublishNext() {
        return gulp.src("package.json", { read: false })
            .pipe(shell([
                "cd ./build/package && npm publish --tag next"
            ]));
    }

    /**
     * Copies all sources to the package directory.
     */
    @MergedTask()
    packageCompile() {
        const tsProject = ts.createProject("tsconfig.json", {
            typescript: require("typescript")
        });
        const tsResult = gulp.src([
            "./src/**/*.ts"
        ])
            .pipe(sourcemaps.init())
            .pipe(tsProject());

        return [
            tsResult.dts.pipe(gulp.dest("./build/package")),
            tsResult.js
                .pipe(sourcemaps.write(".", { sourceRoot: "", includeContent: true }))
                .pipe(gulp.dest("./build/package"))
        ];
    }

    /**
     * Moves all compiled files to the final package directory.
     */
    @Task()
    packageMoveCompiledFiles() {
        return gulp.src("./build/package/src/**/*")
            .pipe(gulp.dest("./build/package"));
    }

    /**
     * Create ESM index file in the final package directory.
     */
    @Task()
    async packageCreateEsmIndex() {
        const buildDir = "./build/package";
        const cjsIndex = require(`${buildDir}/index.js`);
        const cjsKeys = Object.keys(cjsIndex).filter(key => key !== "default" && !key.startsWith("__"));

        const indexMjsContent =
            'import TypeORM from "./index.js";\n' +
            `const {\n    ${cjsKeys.join(",\n    ")}\n} = TypeORM;\n` +
            `export {\n    ${cjsKeys.join(",\n    ")}\n};\n` +
            'export default TypeORM;\n';

        await fs.writeFile(`${buildDir}/index.mjs`, indexMjsContent, "utf8");
    }

    /**
     * Removes /// <reference from compiled sources.
     */
    @Task()
    packageReplaceReferences() {
        return gulp.src("./build/package/**/*.d.ts")
            .pipe(replace(`/// <reference types="node" />`, ""))
            .pipe(replace(`/// <reference types="chai" />`, ""))
            .pipe(gulp.dest("./build/package"));
    }

    /**
     * Moves all compiled files to the final package directory.
     */
    @Task()
    async packageClearPackageDirectory() {
        return rimraf([
            "build/package/src/**"
        ], { glob: true });
    }

    /**
     * Change the "private" state of the packaged package.json file to public.
     */
    @Task()
    packagePreparePackageFile() {
        return gulp.src("./package.json")
            .pipe(replace("\"private\": true,", "\"private\": false,"))
            .pipe(gulp.dest("./build/package"));
    }

    /**
     * Copies README.md into the package.
     */
    @Task()
    packageCopyReadme() {
        return gulp.src("./README.md")
            .pipe(replace(/```typescript([\s\S]*?)```/g, "```javascript$1```"))
            .pipe(gulp.dest("./build/package"));
    }

    /**
     * Copies shims to use typeorm in different environment and conditions file into package.
     */
    @Task()
    packageCopyShims() {
        return gulp.src(["./extra/typeorm-model-shim.js", "./extra/typeorm-class-transformer-shim.js"])
            .pipe(gulp.dest("./build/package"));
    }

    /**
     * Move reference to package.json one level up
     */
    @Task()
    movePackageJsonReferenceLevelUp() {
        return gulp.src("./build/package/commands/InitCommand.js")
            .pipe(replace(/\.\.\/package.json/g, "package.json"))
            .pipe(gulp.dest("./build/package/commands"));
    }

    /**
     * Creates a package that can be published to npm.
     */
    @SequenceTask()
    package() {
        return [
            "clean",
            ["browserCopySources", "browserCopyTemplates"],
            ["packageCompile", "browserCompile"],
            "packageMoveCompiledFiles",
            "packageCreateEsmIndex",
            [
                "browserClearPackageDirectory",
                "packageClearPackageDirectory",
                "packageReplaceReferences",
                "packagePreparePackageFile",
                "packageCopyReadme",
                "packageCopyShims",
                "movePackageJsonReferenceLevelUp"
            ],
        ];
    }

    /**
     * Creates a package .tgz
     */
    @SequenceTask()
    pack() {
        return ["package", "packagePack"];
    }

    /**
     * Creates a package and publishes it to npm.
     */
    @SequenceTask()
    publish() {
        return ["package", "packagePublish"];
    }

    /**
     * Creates a package and publishes it to npm with @next tag.
     */
    @SequenceTask("publish-next")
    publishNext() {
        return ["package", "packagePublishNext"];
    }

}
