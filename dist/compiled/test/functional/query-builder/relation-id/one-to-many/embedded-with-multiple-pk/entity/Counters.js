"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../../../src/decorator/columns/Column");
var PrimaryColumn_1 = require("../../../../../../../src/decorator/columns/PrimaryColumn");
var OneToMany_1 = require("../../../../../../../src/decorator/relations/OneToMany");
var Category_1 = require("./Category");
var Subcounters_1 = require("./Subcounters");
var Counters = /** @class */ (function () {
    function Counters() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Counters.prototype, "code", void 0);
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
        OneToMany_1.OneToMany(function (type) { return Category_1.Category; }, function (category) { return category.post; }),
        tslib_1.__metadata("design:type", Array)
    ], Counters.prototype, "categories", void 0);
    tslib_1.__decorate([
        Column_1.Column(function () { return Subcounters_1.Subcounters; }),
        tslib_1.__metadata("design:type", Subcounters_1.Subcounters)
    ], Counters.prototype, "subcounters", void 0);
    return Counters;
}());
exports.Counters = Counters;
//# sourceMappingURL=Counters.js.map