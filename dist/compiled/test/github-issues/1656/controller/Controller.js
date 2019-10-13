"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var A_1 = require("../entity/A");
var B_1 = require("../entity/B");
var C_1 = require("../entity/C");
var Controller = /** @class */ (function () {
    function Controller() {
    }
    Controller.prototype.t = function (a, b, c, aRepository, bRepository, cRepository) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                if (aRepository && bRepository && cRepository) {
                    return [2 /*return*/, [aRepository.metadata.tableName, bRepository.metadata.tableName, cRepository.metadata.tableName]];
                }
                throw new Error();
            });
        });
    };
    tslib_1.__decorate([
        src_1.Transaction("mysql"),
        tslib_1.__param(3, src_1.TransactionRepository(A_1.A)),
        tslib_1.__param(4, src_1.TransactionRepository(B_1.B)),
        tslib_1.__param(5, src_1.TransactionRepository(C_1.C)),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", [A_1.A, B_1.B, C_1.C,
            src_1.Repository,
            src_1.Repository,
            src_1.Repository]),
        tslib_1.__metadata("design:returntype", Promise)
    ], Controller.prototype, "t", null);
    return Controller;
}());
exports.Controller = Controller;
//# sourceMappingURL=Controller.js.map