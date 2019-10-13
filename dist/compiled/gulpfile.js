"use strict";
///<reference path="node_modules/@types/node/index.d.ts"/>
///<reference path="node_modules/@types/chai/index.d.ts"/>
///<reference path="node_modules/@types/mocha/index.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var gulpclass_1 = require("gulpclass");
var gulp = require("gulp");
var del = require("del");
var shell = require("gulp-shell");
var replace = require("gulp-replace");
var rename = require("gulp-rename");
var mocha = require("gulp-mocha");
var chai = require("chai");
var tslint = require("gulp-tslint");
var sourcemaps = require("gulp-sourcemaps");
var istanbul = require("gulp-istanbul");
var remapIstanbul = require("remap-istanbul/lib/gulpRemapIstanbul");
var ts = require("gulp-typescript");
var args = require("yargs").argv;
var Gulpfile = /** @class */ (function () {
    function Gulpfile() {
    }
    // -------------------------------------------------------------------------
    // General tasks
    // -------------------------------------------------------------------------
    /**
     * Creates a delay and resolves after 15 seconds.
     */
    Gulpfile.prototype.wait = function (cb) {
        setTimeout(function () { return cb(); }, 15000);
    };
    /**
     * Cleans build folder.
     */
    Gulpfile.prototype.clean = function (cb) {
        return del(["./build/**"], cb);
    };
    /**
     * Runs typescript files compilation.
     */
    Gulpfile.prototype.compile = function () {
        return gulp.src("package.json", { read: false })
            .pipe(shell(["npm run compile"]));
    };
    // -------------------------------------------------------------------------
    // Build and packaging for browser
    // -------------------------------------------------------------------------
    /**
     * Copies all source files into destination folder in a correct structure.
     */
    Gulpfile.prototype.browserCopySources = function () {
        return gulp.src([
            "./src/**/*.ts",
            "!./src/commands/*.ts",
            "!./src/cli.ts",
            "!./src/typeorm.ts",
            "!./src/typeorm-model-shim.ts",
            "!./src/platform/PlatformTools.ts"
        ])
            .pipe(gulp.dest("./build/browser/src"));
    };
    /**
     * Replaces PlatformTools with browser-specific implementation called BrowserPlatformTools.
     */
    Gulpfile.prototype.browserCopyPlatformTools = function () {
        return gulp.src("./src/platform/BrowserPlatformTools.template")
            .pipe(rename("PlatformTools.ts"))
            .pipe(gulp.dest("./build/browser/src/platform"));
    };
    /**
     * Adds dummy classes for disabled drivers (replacement is done via browser entry point in package.json)
     */
    Gulpfile.prototype.browserCopyDisabledDriversDummy = function () {
        return gulp.src("./src/platform/BrowserDisabledDriversDummy.template")
            .pipe(rename("BrowserDisabledDriversDummy.ts"))
            .pipe(gulp.dest("./build/browser/src/platform"));
    };
    Gulpfile.prototype.browserCompile = function () {
        var tsProject = ts.createProject("tsconfig.json", {
            module: "es2015",
            "lib": ["es5", "es6", "dom"],
            typescript: require("typescript")
        });
        var tsResult = gulp.src(["./build/browser/src/**/*.ts", "./node_modules/reflect-metadata/**/*.d.ts", "./node_modules/@types/**/*.ts"])
            .pipe(sourcemaps.init())
            .pipe(tsProject());
        return [
            tsResult.dts.pipe(gulp.dest("./build/package/browser")),
            tsResult.js
                .pipe(sourcemaps.write(".", { sourceRoot: "", includeContent: true }))
                .pipe(gulp.dest("./build/package/browser"))
        ];
    };
    Gulpfile.prototype.browserClearPackageDirectory = function (cb) {
        return del([
            "./build/browser/**"
        ]);
    };
    // -------------------------------------------------------------------------
    // Main Packaging and Publishing tasks
    // -------------------------------------------------------------------------
    /**
     * Publishes a package to npm from ./build/package directory.
     */
    Gulpfile.prototype.packagePublish = function () {
        return gulp.src("package.json", { read: false })
            .pipe(shell([
            "cd ./build/package && npm publish"
        ]));
    };
    /**
     * Publishes a package to npm from ./build/package directory with @next tag.
     */
    Gulpfile.prototype.packagePublishNext = function () {
        return gulp.src("package.json", { read: false })
            .pipe(shell([
            "cd ./build/package && npm publish --tag next"
        ]));
    };
    /**
     * Copies all sources to the package directory.
     */
    Gulpfile.prototype.packageCompile = function () {
        var tsProject = ts.createProject("tsconfig.json", {
            typescript: require("typescript")
        });
        var tsResult = gulp.src([
            "./src/**/*.ts",
            "./node_modules/@types/**/*.ts",
        ])
            .pipe(sourcemaps.init())
            .pipe(tsProject());
        return [
            tsResult.dts.pipe(gulp.dest("./build/package")),
            tsResult.js
                .pipe(sourcemaps.write(".", { sourceRoot: "", includeContent: true }))
                .pipe(gulp.dest("./build/package"))
        ];
    };
    /**
     * Moves all compiled files to the final package directory.
     */
    Gulpfile.prototype.packageMoveCompiledFiles = function () {
        return gulp.src("./build/package/src/**/*")
            .pipe(gulp.dest("./build/package"));
    };
    /**
     * Removes /// <reference from compiled sources.
     */
    Gulpfile.prototype.packageReplaceReferences = function () {
        return gulp.src("./build/package/**/*.d.ts")
            .pipe(replace("/// <reference types=\"node\" />", ""))
            .pipe(replace("/// <reference types=\"chai\" />", ""))
            .pipe(gulp.dest("./build/package"));
    };
    /**
     * Moves all compiled files to the final package directory.
     */
    Gulpfile.prototype.packageClearPackageDirectory = function (cb) {
        return del([
            "build/package/src/**"
        ], cb);
    };
    /**
     * Change the "private" state of the packaged package.json file to public.
     */
    Gulpfile.prototype.packagePreparePackageFile = function () {
        return gulp.src("./package.json")
            .pipe(replace("\"private\": true,", "\"private\": false,"))
            .pipe(gulp.dest("./build/package"));
    };
    /**
     * Copies README.md into the package.
     */
    Gulpfile.prototype.packageCopyReadme = function () {
        return gulp.src("./README.md")
            .pipe(replace(/```typescript([\s\S]*?)```/g, "```javascript$1```"))
            .pipe(gulp.dest("./build/package"));
    };
    /**
     * Copies shims to use typeorm in different environment and conditions file into package.
     */
    Gulpfile.prototype.packageCopyShims = function () {
        return gulp.src(["./extra/typeorm-model-shim.js", "./extra/typeorm-class-transformer-shim.js"])
            .pipe(gulp.dest("./build/package"));
    };
    /**
     * Creates a package that can be published to npm.
     */
    Gulpfile.prototype.package = function () {
        return [
            "clean",
            ["browserCopySources", "browserCopyPlatformTools", "browserCopyDisabledDriversDummy"],
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
    };
    /**
     * Creates a package and publishes it to npm.
     */
    Gulpfile.prototype.publish = function () {
        return ["package", "packagePublish"];
    };
    /**
     * Creates a package and publishes it to npm with @next tag.
     */
    Gulpfile.prototype.publishNext = function () {
        return ["package", "packagePublishNext"];
    };
    // -------------------------------------------------------------------------
    // Run tests tasks
    // -------------------------------------------------------------------------
    /**
     * Runs ts linting to validate source code.
     */
    Gulpfile.prototype.tslint = function () {
        return gulp.src(["./src/**/*.ts", "./test/**/*.ts", "./sample/**/*.ts"])
            .pipe(tslint({
            formatter: "stylish"
        }))
            .pipe(tslint.report({
            emitError: true,
            sort: true,
            bell: true
        }));
    };
    /**
     * Runs before test coverage, required step to perform a test coverage.
     */
    Gulpfile.prototype.coveragePre = function () {
        return gulp.src(["./build/compiled/src/**/*.js"])
            .pipe(istanbul())
            .pipe(istanbul.hookRequire());
    };
    /**
     * Runs post coverage operations.
     */
    Gulpfile.prototype.coveragePost = function () {
        return gulp.src(["./build/compiled/test/**/*.js"])
            .pipe(istanbul.writeReports());
    };
    /**
     * Runs mocha tests.
     */
    Gulpfile.prototype.runTests = function () {
        chai.should();
        chai.use(require("sinon-chai"));
        chai.use(require("chai-as-promised"));
        return gulp.src(["./build/compiled/test/**/*.js"])
            .pipe(mocha({
            bail: true,
            grep: !!args.grep ? new RegExp(args.grep) : undefined,
            timeout: 15000
        }));
    };
    Gulpfile.prototype.coverageRemap = function () {
        return gulp.src("./coverage/coverage-final.json")
            .pipe(remapIstanbul())
            .pipe(gulp.dest("./coverage"));
    };
    /**
     * Compiles the code and runs tests + makes coverage report.
     */
    Gulpfile.prototype.tests = function () {
        return [
            "compile",
            "coveragePre",
            "runTests",
            "coveragePost",
            "coverageRemap"
        ];
    };
    /**
     * Runs tests, but creates a small delay before running them to make sure to give time for docker containers to be initialized.
     */
    Gulpfile.prototype.ciTests = function () {
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
    };
    // -------------------------------------------------------------------------
    // CI tasks
    // -------------------------------------------------------------------------
    Gulpfile.prototype.createTravisOrmConfig = function () {
        return gulp.src("./ormconfig.travis.json")
            .pipe(rename("ormconfig.json"))
            .pipe(gulp.dest("./"));
    };
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", [Function]),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "wait", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", [Function]),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "clean", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "compile", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "browserCopySources", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "browserCopyPlatformTools", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "browserCopyDisabledDriversDummy", null);
    tslib_1.__decorate([
        gulpclass_1.MergedTask(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "browserCompile", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", [Function]),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "browserClearPackageDirectory", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "packagePublish", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "packagePublishNext", null);
    tslib_1.__decorate([
        gulpclass_1.MergedTask(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "packageCompile", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "packageMoveCompiledFiles", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "packageReplaceReferences", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", [Function]),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "packageClearPackageDirectory", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "packagePreparePackageFile", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "packageCopyReadme", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "packageCopyShims", null);
    tslib_1.__decorate([
        gulpclass_1.SequenceTask(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "package", null);
    tslib_1.__decorate([
        gulpclass_1.SequenceTask(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "publish", null);
    tslib_1.__decorate([
        gulpclass_1.SequenceTask("publish-next"),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "publishNext", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "tslint", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "coveragePre", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "coveragePost", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "runTests", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "coverageRemap", null);
    tslib_1.__decorate([
        gulpclass_1.SequenceTask(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "tests", null);
    tslib_1.__decorate([
        gulpclass_1.SequenceTask("ci-tests"),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "ciTests", null);
    tslib_1.__decorate([
        gulpclass_1.Task(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Gulpfile.prototype, "createTravisOrmConfig", null);
    Gulpfile = tslib_1.__decorate([
        gulpclass_1.Gulpclass()
    ], Gulpfile);
    return Gulpfile;
}());
exports.Gulpfile = Gulpfile;
//# sourceMappingURL=gulpfile.js.map