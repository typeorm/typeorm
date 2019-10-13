"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
var Product_1 = require("./entity/Product");
var DeliverySlot_1 = require("./entity/DeliverySlot");
var Order_1 = require("./entity/Order");
var OrderItem_1 = require("./entity/OrderItem");
describe.skip("github issues > #1581 Composite key breaks OneToMany relation", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("throws an error because there is no object id defined", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, product1, product2, slot1, slot2, order1, item1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User();
                    user1.email = "user1@example.com";
                    return [4 /*yield*/, connection.manager.save(user1)];
                case 1:
                    _a.sent();
                    product1 = new Product_1.Product();
                    product1.id = 1;
                    product1.name = "Product 1";
                    return [4 /*yield*/, connection.manager.save(product1)];
                case 2:
                    _a.sent();
                    product2 = new Product_1.Product();
                    product2.id = 3;
                    product2.name = "Product 2";
                    return [4 /*yield*/, connection.manager.save(product2)];
                case 3:
                    _a.sent();
                    slot1 = new DeliverySlot_1.DeliverySlot();
                    slot1.name = "Slot 1";
                    return [4 /*yield*/, connection.manager.save(slot1)];
                case 4:
                    _a.sent();
                    slot2 = new DeliverySlot_1.DeliverySlot();
                    slot2.name = "Slot 2";
                    return [4 /*yield*/, connection.manager.save(slot2)];
                case 5:
                    _a.sent();
                    order1 = new Order_1.Order();
                    order1.deliverySlot = slot1;
                    order1.user = user1;
                    order1.enabled = true;
                    return [4 /*yield*/, connection.manager.save(order1)];
                case 6:
                    _a.sent();
                    item1 = new OrderItem_1.OrderItem();
                    item1.order = order1;
                    item1.product = product1;
                    item1.amount = 3;
                    return [4 /*yield*/, connection.manager.save(item1)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Order_1.Order, "order")
                            .leftJoinAndSelect("order.deliverySlot", "deliverySlot")
                            .leftJoinAndSelect("order.user", "user")
                            .leftJoinAndSelect("order.items", "items")
                            .getMany()];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1581.js.map