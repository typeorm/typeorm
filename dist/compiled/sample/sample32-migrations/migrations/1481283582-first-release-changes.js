"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var FirstReleaseMigration1481283582 = /** @class */ (function () {
    function FirstReleaseMigration1481283582() {
    }
    FirstReleaseMigration1481283582.prototype.up = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.renameColumn("post", "title", "name")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    FirstReleaseMigration1481283582.prototype.down = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.renameColumn("post", "name", "title")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return FirstReleaseMigration1481283582;
}());
exports.FirstReleaseMigration1481283582 = FirstReleaseMigration1481283582;
//# sourceMappingURL=1481283582-first-release-changes.js.map