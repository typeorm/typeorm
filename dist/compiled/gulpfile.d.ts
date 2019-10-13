export declare class Gulpfile {
    /**
     * Creates a delay and resolves after 15 seconds.
     */
    wait(cb: Function): void;
    /**
     * Cleans build folder.
     */
    clean(cb: Function): any;
    /**
     * Runs typescript files compilation.
     */
    compile(): any;
    /**
     * Copies all source files into destination folder in a correct structure.
     */
    browserCopySources(): any;
    /**
     * Replaces PlatformTools with browser-specific implementation called BrowserPlatformTools.
     */
    browserCopyPlatformTools(): any;
    /**
     * Adds dummy classes for disabled drivers (replacement is done via browser entry point in package.json)
     */
    browserCopyDisabledDriversDummy(): any;
    browserCompile(): any[];
    browserClearPackageDirectory(cb: Function): any;
    /**
     * Publishes a package to npm from ./build/package directory.
     */
    packagePublish(): any;
    /**
     * Publishes a package to npm from ./build/package directory with @next tag.
     */
    packagePublishNext(): any;
    /**
     * Copies all sources to the package directory.
     */
    packageCompile(): any[];
    /**
     * Moves all compiled files to the final package directory.
     */
    packageMoveCompiledFiles(): any;
    /**
     * Removes /// <reference from compiled sources.
     */
    packageReplaceReferences(): any;
    /**
     * Moves all compiled files to the final package directory.
     */
    packageClearPackageDirectory(cb: Function): any;
    /**
     * Change the "private" state of the packaged package.json file to public.
     */
    packagePreparePackageFile(): any;
    /**
     * Copies README.md into the package.
     */
    packageCopyReadme(): any;
    /**
     * Copies shims to use typeorm in different environment and conditions file into package.
     */
    packageCopyShims(): any;
    /**
     * Creates a package that can be published to npm.
     */
    package(): (string | string[])[];
    /**
     * Creates a package and publishes it to npm.
     */
    publish(): string[];
    /**
     * Creates a package and publishes it to npm with @next tag.
     */
    publishNext(): string[];
    /**
     * Runs ts linting to validate source code.
     */
    tslint(): any;
    /**
     * Runs before test coverage, required step to perform a test coverage.
     */
    coveragePre(): any;
    /**
     * Runs post coverage operations.
     */
    coveragePost(): any;
    /**
     * Runs mocha tests.
     */
    runTests(): any;
    coverageRemap(): any;
    /**
     * Compiles the code and runs tests + makes coverage report.
     */
    tests(): string[];
    /**
     * Runs tests, but creates a small delay before running them to make sure to give time for docker containers to be initialized.
     */
    ciTests(): string[];
    createTravisOrmConfig(): any;
}
