"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionCommand = void 0;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
/**
 * Shows typeorm version.
 */
class VersionCommand {
    constructor() {
        this.command = "version";
        this.describe = "Prints TypeORM version this project uses.";
    }
    handler() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const localNpmList = yield VersionCommand.executeCommand("npm list --depth=0");
            const localMatches = localNpmList.match(/ typeorm@(.*)\n/);
            const localNpmVersion = (localMatches && localMatches[1] ? localMatches[1] : "").replace(/"invalid"/gi, "").trim();
            const globalNpmList = yield VersionCommand.executeCommand("npm list -g --depth=0");
            const globalMatches = globalNpmList.match(/ typeorm@(.*)\n/);
            const globalNpmVersion = (globalMatches && globalMatches[1] ? globalMatches[1] : "").replace(/"invalid"/gi, "").trim();
            if (localNpmVersion) {
                console.log("Local installed version:", localNpmVersion);
            }
            else {
                console.log("No local installed TypeORM was found.");
            }
            if (globalNpmVersion) {
                console.log("Global installed TypeORM version:", globalNpmVersion);
            }
            else {
                console.log("No global installed was found.");
            }
            if (localNpmVersion && globalNpmVersion && localNpmVersion !== globalNpmVersion) {
                console.log("To avoid issues with CLI please make sure your global and local TypeORM versions match, " +
                    "or you are using locally installed TypeORM instead of global one.");
            }
        });
    }
    static executeCommand(command) {
        return new Promise((ok, fail) => {
            (0, child_process_1.exec)(command, (error, stdout, stderr) => {
                if (stdout)
                    return ok(stdout);
                if (stderr)
                    return ok(stderr);
                if (error)
                    return fail(error);
                ok("");
            });
        });
    }
}
exports.VersionCommand = VersionCommand;

//# sourceMappingURL=VersionCommand.js.map
