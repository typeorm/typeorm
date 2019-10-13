"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Product_1 = require("./entity/Product");
describe("github issues > #752 postgres - count query fails for empty table", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should return user by a given email and proper escape 'user' keyword", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var product, count;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    product = new Product_1.Product();
                    product.name = "Apple";
                    product.productVersionId = 1;
                    return [4 /*yield*/, connection.manager.save(product)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Product_1.Product).count({ productVersionId: 1 })];
                case 2:
                    count = _a.sent();
                    count.should.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-752.js.map