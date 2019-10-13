"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var Information_1 = require("./Information");
var src_1 = require("../../../../../../src");
var Counters = /** @class */ (function () {
    function Counters() {
    }
    Counters.prototype.beforeInsert = function () {
        this.likes = 100;
    };
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Counters.prototype, "likes", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return Information_1.Information; }),
        tslib_1.__metadata("design:type", Information_1.Information)
    ], Counters.prototype, "information", void 0);
    tslib_1.__decorate([
        src_1.BeforeInsert(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Counters.prototype, "beforeInsert", null);
    return Counters;
}());
exports.Counters = Counters;
//# sourceMappingURL=Counters.js.map