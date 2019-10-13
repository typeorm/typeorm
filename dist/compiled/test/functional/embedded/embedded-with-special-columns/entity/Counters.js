"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var CreateDateColumn_1 = require("../../../../../src/decorator/columns/CreateDateColumn");
var UpdateDateColumn_1 = require("../../../../../src/decorator/columns/UpdateDateColumn");
var Subcounters_1 = require("./Subcounters");
var Counters = /** @class */ (function () {
    function Counters() {
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Counters.prototype, "likes", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Counters.prototype, "comments", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Counters.prototype, "favorites", void 0);
    tslib_1.__decorate([
        Column_1.Column(function () { return Subcounters_1.Subcounters; }, { prefix: "subcnt" }),
        tslib_1.__metadata("design:type", Subcounters_1.Subcounters)
    ], Counters.prototype, "subcounters", void 0);
    tslib_1.__decorate([
        CreateDateColumn_1.CreateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], Counters.prototype, "createdDate", void 0);
    tslib_1.__decorate([
        UpdateDateColumn_1.UpdateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], Counters.prototype, "updatedDate", void 0);
    return Counters;
}());
exports.Counters = Counters;
//# sourceMappingURL=Counters.js.map