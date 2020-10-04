///<reference path="node_modules/@types/node/index.d.ts"/>
///<reference path="node_modules/@types/chai/index.d.ts"/>
///<reference path="node_modules/@types/mocha/index.d.ts"/>

import {Gulpclass, Task, SequenceTask, MergedTask} from "gulpclass";

const gulp = require("gulp");
const del = require("del");
const shell = require("gulp-shell");
const replace = require("gulp-replace");
const rename = require("gulp-rename");
const mocha = require("gulp-mocha");
const chai = require("chai");
const eslint = require("gulp-eslint");
const sourcemaps = require("gulp-sourcemaps");
const istanbul = require("gulp-istanbul");
const remapIstanbul = require("remap-istanbul/lib/gulpRemapIstanbul");
const ts = require("gulp-typescript");
const args = require("yargs").argv;

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
            .pipe(rename((p: any) => { p.extname = '.ts'; }))
            .pipe(gulp.dest("./build/browser/src/platform"));
    }

    @MergedTask()
    browserCompile() {
        const tsProject = ts.createProject("tsconfig.json", {
            module: "es2015",
            "lib": ["es5", "es6", "dom"],
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
    packageClearPackageDirectory(cb: Function) {
        return del([
            "build/package/src/**"
        ], cb);
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
            ["browserCopySources", "browserCopyTemplates"],
            ["packageCompile", "browserCompile"],
            "packageMoveCompiledFiles",
            [
                "browserClearPackageDirectory",
                "packageClearPackageDirectory",
                "packageReplaceReferences",
                "packagePreparePackageFile",
                "packageCopyReadme",
                "packageCopyShims"
            ],
        ];
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

    // -------------------------------------------------------------------------
    // Run tests tasks
    // -------------------------------------------------------------------------

    /**
     * Runs ts linting to validate source code.
     */
    @Task()
    eslint() {
        return gulp.src(["./src/**/*.ts", "./test/**/*.ts", "./sample/**/*.ts"])
            .pipe(eslint())
            .pipe(eslint.format('stylish'))
            .pipe(eslint.failAfterError())
    }

    /**
     * Runs before test coverage, required step to perform a test coverage.
     */
    @Task()
    coveragePre() {
        return gulp.src(["./build/compiled/src/**/*.js"])
            .pipe(istanbul())
            .pipe(istanbul.hookRequire());
    }

    /**
     * Runs post coverage operations.
     */
    @Task()
    coveragePost() {
        return gulp.src(["./build/compiled/test/**/*.js"])
            .pipe(istanbul.writeReports());
    }

    /**
     * Runs mocha tests.
     */
    @Task()
    runTests() {
        chai.should();
        chai.use(require("sinon-chai"));
        chai.use(require("chai-as-promised"));

        return gulp.src(["./build/compiled/test/**/*.js"])
            .pipe(mocha({
                bail: true,
                grep: !!args.grep ? new RegExp(args.grep) : undefined,
                timeout: 15000
            }));
    }

    @Task()
    coverageRemap() {
        return gulp.src("./coverage/coverage-final.json")
            .pipe(remapIstanbul())
            .pipe(gulp.dest("./coverage"));
    }

    /**
     * Compiles the code and runs tests + makes coverage report.
     */
    @SequenceTask()
    tests() {
        return [
            "compile",
            "coveragePre",
            "runTests",
            "coveragePost",
            "coverageRemap"
        ];
    }

    /**
     * Runs tests, but creates a small delay before running them to make sure to give time for docker containers to be initialized.
     */
    @SequenceTask("ci-tests")
    ciTests() {
        return [
            "clean",
            "compile",
            "tslint",
            "wait",
            "coveragePre",
            "runTests",
            "coveragePost",
            "coverageRemap"
        ];
    }

    // -------------------------------------------------------------------------
    // CI tasks
    // -------------------------------------------------------------------------

    @Task()
    createTravisOrmConfig() {
        return gulp.src("./ormconfig.travis.json")
            .pipe(rename("ormconfig.json"))
            .pipe(gulp.dest("./"));
    }

}
