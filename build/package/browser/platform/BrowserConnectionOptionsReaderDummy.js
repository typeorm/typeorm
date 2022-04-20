import { __awaiter, __generator } from "tslib";
/**
 * Dummy class for replacement via `package.json` in browser builds.
 *
 * If we don't include these functions typeorm will throw an error on runtime
 * as well as during webpack builds.
 */
var ConnectionOptionsEnvReader = /** @class */ (function () {
    function ConnectionOptionsEnvReader() {
    }
    ConnectionOptionsEnvReader.prototype.read = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Cannot read connection options in a browser context.");
            });
        });
    };
    return ConnectionOptionsEnvReader;
}());
export { ConnectionOptionsEnvReader };
/**
 * Dummy class for replacement via `package.json` in browser builds.
 *
 * If we don't include these functions typeorm will throw an error on runtime
 * as well as during webpack builds.
 */
var ConnectionOptionsXmlReader = /** @class */ (function () {
    function ConnectionOptionsXmlReader() {
    }
    ConnectionOptionsXmlReader.prototype.read = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Cannot read connection options in a browser context.");
            });
        });
    };
    return ConnectionOptionsXmlReader;
}());
export { ConnectionOptionsXmlReader };
/**
 * Dummy class for replacement via `package.json` in browser builds.
 *
 * If we don't include these functions typeorm will throw an error on runtime
 * as well as during webpack builds.
 */
var ConnectionOptionsYmlReader = /** @class */ (function () {
    function ConnectionOptionsYmlReader() {
    }
    ConnectionOptionsYmlReader.prototype.read = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Cannot read connection options in a browser context.");
            });
        });
    };
    return ConnectionOptionsYmlReader;
}());
export { ConnectionOptionsYmlReader };
/**
 * Dummy class for replacement via `package.json` in browser builds.
 *
 * If we don't include these functions typeorm will throw an error on runtime
 * as well as during webpack builds.
 */
var ConnectionOptionsReader = /** @class */ (function () {
    function ConnectionOptionsReader() {
    }
    ConnectionOptionsReader.prototype.all = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Cannot read connection options in a browser context.");
            });
        });
    };
    ConnectionOptionsReader.prototype.get = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Cannot read connection options in a browser context.");
            });
        });
    };
    ConnectionOptionsReader.prototype.has = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Cannot read connection options in a browser context.");
            });
        });
    };
    return ConnectionOptionsReader;
}());
export { ConnectionOptionsReader };

//# sourceMappingURL=BrowserConnectionOptionsReaderDummy.js.map
