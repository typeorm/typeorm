"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Order_1 = require("./Order");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column({ unique: true }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "email", void 0);
    tslib_1.__decorate([
        src_1.OneToMany(function (type) { return Order_1.Order; }, function (recurringOrder) { return recurringOrder.user; }),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "recurringOrders", void 0);
    User = tslib_1.__decorate([
        src_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map