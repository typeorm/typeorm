"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var DeliverySlot_1 = require("./DeliverySlot");
var User_1 = require("./User");
var OrderItem_1 = require("./OrderItem");
var src_1 = require("../../../../src");
var Order = /** @class */ (function () {
    function Order() {
    }
    tslib_1.__decorate([
        src_1.ManyToOne(function (type) { return DeliverySlot_1.DeliverySlot; }, { primary: true }),
        tslib_1.__metadata("design:type", DeliverySlot_1.DeliverySlot)
    ], Order.prototype, "deliverySlot", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function (type) { return User_1.User; }, function (user) { return user.recurringOrders; }, { primary: true }),
        tslib_1.__metadata("design:type", User_1.User)
    ], Order.prototype, "user", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], Order.prototype, "enabled", void 0);
    tslib_1.__decorate([
        src_1.OneToMany(function (type) { return OrderItem_1.OrderItem; }, function (item) { return item.order; }),
        tslib_1.__metadata("design:type", Array)
    ], Order.prototype, "items", void 0);
    Order = tslib_1.__decorate([
        src_1.Entity()
    ], Order);
    return Order;
}());
exports.Order = Order;
//# sourceMappingURL=Order.js.map