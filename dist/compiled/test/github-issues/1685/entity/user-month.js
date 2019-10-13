"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var month_1 = require("./month");
var user_1 = require("./user");
var UserMonth = /** @class */ (function () {
    function UserMonth() {
    }
    UserMonth.prototype.workaround = function () {
        // Here a workaround for this issue
        // this.yearNo = this.month.year.yearNo;
    };
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], UserMonth.prototype, "yearNo", void 0);
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], UserMonth.prototype, "monthNo", void 0);
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], UserMonth.prototype, "username", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function (type) { return month_1.Month; }, function (month) { return month.userMonth; }),
        src_1.JoinColumn([
            { name: "yearNo", referencedColumnName: "yearNo" },
            { name: "monthNo", referencedColumnName: "monthNo" }
        ]),
        tslib_1.__metadata("design:type", month_1.Month)
    ], UserMonth.prototype, "month", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function (type) { return user_1.User; }, function (user) { return user.username; }),
        src_1.JoinColumn({ name: "username", referencedColumnName: "username" }),
        tslib_1.__metadata("design:type", user_1.User)
    ], UserMonth.prototype, "user", void 0);
    tslib_1.__decorate([
        src_1.BeforeInsert(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], UserMonth.prototype, "workaround", null);
    UserMonth = tslib_1.__decorate([
        src_1.Entity()
    ], UserMonth);
    return UserMonth;
}());
exports.UserMonth = UserMonth;
//# sourceMappingURL=user-month.js.map