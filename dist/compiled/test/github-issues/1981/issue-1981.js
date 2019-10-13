"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var test_utils_1 = require("../../utils/test-utils");
var Product_1 = require("./entity/Product");
describe("github issues > #1981 Boolean values not casted properly when used in .find() condition", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["sqlite"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should be able to find by boolean find", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var product, loadedProduct;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    product = new Product_1.Product();
                    product.liked = true;
                    return [4 /*yield*/, connection.manager.save(product)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Product_1.Product, { liked: true })];
                case 2:
                    loadedProduct = _a.sent();
                    loadedProduct.liked.should.be.equal(true);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1981.js.map