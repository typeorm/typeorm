"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var year_1 = require("./year");
var user_month_1 = require("./user-month");
var Month = /** @class */ (function () {
    function Month() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Month.prototype, "yearNo", void 0);
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Month.prototype, "monthNo", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function (type) { return year_1.Year; }, function (year) { return year.month; }),
        src_1.JoinColumn({ name: "yearNo", referencedColumnName: "yearNo" }),
        tslib_1.__metadata("design:type", year_1.Year)
    ], Month.prototype, "year", void 0);
    tslib_1.__decorate([
        src_1.OneToMany(function (type) { return user_month_1.UserMonth; }, function (userMonth) { return userMonth.month; }),
        tslib_1.__metadata("design:type", Array)
    ], Month.prototype, "userMonth", void 0);
    Month = tslib_1.__decorate([
        src_1.Entity()
    ], Month);
    return Month;
}());
exports.Month = Month;
//# sourceMappingURL=month.js.map