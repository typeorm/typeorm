"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Counters = /** @class */ (function () {
    function Counters() {
    }
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Counters.prototype, "raiting", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Counters.prototype, "stars", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Counters.prototype, "commentCount", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Counters.prototype, "metadata", void 0);
    return Counters;
}());
exports.Counters = Counters;
//# sourceMappingURL=Counters.js.map