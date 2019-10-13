"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var user_month_1 = require("./user-month");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "username", void 0);
    tslib_1.__decorate([
        src_1.OneToMany(function (type) { return user_month_1.UserMonth; }, function (userMonth) { return userMonth.user; }),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "userMonths", void 0);
    User = tslib_1.__decorate([
        src_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=user.js.map