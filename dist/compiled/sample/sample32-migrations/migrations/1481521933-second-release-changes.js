"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var SecondReleaseMigration1481521933 = /** @class */ (function () {
    function SecondReleaseMigration1481521933() {
    }
    SecondReleaseMigration1481521933.prototype.up = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.query("ALTER TABLE `post` CHANGE `name` `title` VARCHAR(500)")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SecondReleaseMigration1481521933.prototype.down = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.query("ALTER TABLE `post` CHANGE `title` `name` VARCHAR(255)")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return SecondReleaseMigration1481521933;
}());
exports.SecondReleaseMigration1481521933 = SecondReleaseMigration1481521933;
//# sourceMappingURL=1481521933-second-release-changes.js.map