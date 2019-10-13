"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Order_1 = require("./Order");
var Product_1 = require("./Product");
var OrderItem = /** @class */ (function () {
    function OrderItem() {
    }
    tslib_1.__decorate([
        src_1.ManyToOne(function (type) { return Order_1.Order; }, function (recurringOrder) { return recurringOrder.items; }, { primary: true }),
        tslib_1.__metadata("design:type", Order_1.Order)
    ], OrderItem.prototype, "order", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function (type) { return Product_1.Product; }, { primary: true }),
        tslib_1.__metadata("design:type", Product_1.Product)
    ], OrderItem.prototype, "product", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], OrderItem.prototype, "amount", void 0);
    OrderItem = tslib_1.__decorate([
        src_1.Entity()
    ], OrderItem);
    return OrderItem;
}());
exports.OrderItem = OrderItem;
//# sourceMappingURL=OrderItem.js.map