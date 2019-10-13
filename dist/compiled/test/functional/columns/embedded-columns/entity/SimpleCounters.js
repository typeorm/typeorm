"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var Information_1 = require("./Information");
var SimpleCounters = /** @class */ (function () {
    function SimpleCounters() {
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], SimpleCounters.prototype, "likes", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], SimpleCounters.prototype, "comments", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], SimpleCounters.prototype, "favorites", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return Information_1.Information; }, { prefix: "info" }),
        tslib_1.__metadata("design:type", Information_1.Information)
    ], SimpleCounters.prototype, "information", void 0);
    return SimpleCounters;
}());
exports.SimpleCounters = SimpleCounters;
//# sourceMappingURL=SimpleCounters.js.map