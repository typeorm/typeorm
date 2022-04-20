"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionCommand = void 0;
var tslib_1 = require("tslib");
var child_process_1 = require("child_process");
/**
 * Shows typeorm version.
 */
var VersionCommand = /** @class */ (function () {
    function VersionCommand() {
        this.command = "version";
        this.describe = "Prints TypeORM version this project uses.";
    }
    VersionCommand.prototype.handler = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var localNpmList, localMatches, localNpmVersion, globalNpmList, globalMatches, globalNpmVersion;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, VersionCommand.executeCommand("npm list --depth=0")];
                    case 1:
                        localNpmList = _a.sent();
                        localMatches = localNpmList.match(/ typeorm@(.*)\n/);
                        localNpmVersion = (localMatches && localMatches[1] ? localMatches[1] : "").replace(/"invalid"/gi, "").trim();
                        return [4 /*yield*/, VersionCommand.executeCommand("npm list -g --depth=0")];
                    case 2:
                        globalNpmList = _a.sent();
                        globalMatches = globalNpmList.match(/ typeorm@(.*)\n/);
                        globalNpmVersion = (globalMatches && globalMatches[1] ? globalMatches[1] : "").replace(/"invalid"/gi, "").trim();
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
                        return [2 /*return*/];
                }
            });
        });
    };
    VersionCommand.executeCommand = function (command) {
        return new Promise(function (ok, fail) {
            child_process_1.exec(command, function (error, stdout, stderr) {
                if (stdout)
                    return ok(stdout);
                if (stderr)
                    return ok(stderr);
                if (error)
                    return fail(error);
                ok("");
            });
        });
    };
    return VersionCommand;
}());
exports.VersionCommand = VersionCommand;

//# sourceMappingURL=VersionCommand.js.map
