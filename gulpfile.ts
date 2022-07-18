///<reference path="node_modules/@types/node/index.d.ts"/>
///<reference path="node_modules/@types/chai/index.d.ts"/>
///<reference path="node_modules/@types/mocha/index.d.ts"/>

import {Gulpclass, Task, SequenceTask, MergedTask} from "gulpclass";

const fs = require("fs");
const gulp = require("gulp");
const del = require("del");
const shell = require("gulp-shell");
const replace = require("gulp-replace");
const rename = require("gulp-rename");
const header = require('gulp-header');

@Gulpclass()
export class Gulpfile {

    // -------------------------------------------------------------------------
    // General tasks
    // -------------------------------------------------------------------------

    /**
     * Creates a delay and resolves after 15 seconds.
     */
    @Task()
    wait(cb: Function) {
        setTimeout(() => cb(), 15000);
    }

    /**
     * Cleans build folder.
     */
    @Task()
    clean(cb: Function) {
        return del(["./build/**"], cb);
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
            "!./src/cli**.ts",
            "!./src/typeorm.ts",
            "!./src/typeorm-model-shim.ts"
        ])
        .pipe(gulp.dest("./build/browser"));
    }

    /**
     * Copies templates for compilation
     */
    @Task()
    browserCopyTemplates() {
        return gulp.src("./src/platform/*.template")
            .pipe(rename((p: any) => { p.extname = '.ts'; }))
            .pipe(gulp.dest("./build/browser/platform"));
    }

    @MergedTask()
    browserCompile() {
        return gulp.src("package.json", { read: false })
            .pipe(shell(["npm run compile:browser"]));
    }

    @Task()
    browserClearPackageDirectory(cb: Function) {
        return del([
            "./build/browser/**"
        ]);
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
        return gulp.src("package.json", { read: false })
            .pipe(shell(["npm run compile:packages"]));
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

        fs.writeFileSync(`${buildDir}/index.mjs`, indexMjsContent, "utf8");
    }

    /**
     * Prepend node shebang in CLI entry files.
     */
    @Task()
    async packageCliFixHeader() {
        return gulp.src('build/package/cli**.js')
            .pipe(header('#!/usr/bin/env node\n'))
            .pipe(gulp.dest('build/package'));
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
     * Creates a package that can be published to npm.
     */
    @SequenceTask()
    package() {
        return [
            "clean",
            gulp.parallel(["browserCopySources", "browserCopyTemplates"]),
            gulp.parallel(["browserCompile", "packageCompile"]),
            gulp.parallel(["packageCreateEsmIndex", "packageCliFixHeader"]),
            gulp.parallel([
                "browserClearPackageDirectory",
                "packageReplaceReferences",
                "packagePreparePackageFile",
                "packageCopyReadme",
                "packageCopyShims"
            ]),
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
