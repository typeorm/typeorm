"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var month_1 = require("./month");
var Year = /** @class */ (function () {
    function Year() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Year.prototype, "yearNo", void 0);
    tslib_1.__decorate([
        src_1.OneToMany(function (type) { return month_1.Month; }, function (month) { return month.yearNo; }),
        tslib_1.__metadata("design:type", Array)
    ], Year.prototype, "month", void 0);
    Year = tslib_1.__decorate([
        src_1.Entity()
    ], Year);
    return Year;
}());
exports.Year = Year;
//# sourceMappingURL=year.js.map