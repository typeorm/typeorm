"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var InitUsers1530542855524 = /** @class */ (function () {
    function InitUsers1530542855524() {
    }
    InitUsers1530542855524.prototype.up = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.query("\n            CREATE SEQUENCE users_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1\n        ")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("\n            DROP SEQUENCE IF EXISTS users_id_seq\n        ")];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    InitUsers1530542855524.prototype.down = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.query("\n            DROP SEQUENCE IF EXISTS users_id_seq\n        ")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return InitUsers1530542855524;
}());
exports.InitUsers1530542855524 = InitUsers1530542855524;
//# sourceMappingURL=1530542855524-CreateUsersSeq.js.map