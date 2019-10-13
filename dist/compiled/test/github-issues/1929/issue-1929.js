"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var Product_1 = require("./entity/Product");
var test_utils_1 = require("../../utils/test-utils");
describe("github issues > #1929 Select attributes in Find method - mongodb", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Product_1.Product],
                        enabledDrivers: ["mongodb"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("return column on include in select on find", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var productRepository, product;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    productRepository = connection.getMongoRepository(Product_1.Product);
                    product = new Product_1.Product("test1", "label1", 10);
                    return [4 /*yield*/, productRepository.save(product)];
                case 1:
                    _a.sent();
                    product = new Product_1.Product("test2", "label2", 20);
                    return [4 /*yield*/, productRepository.save(product)];
                case 2:
                    _a.sent();
                    product = new Product_1.Product("test3", "label3", 30);
                    return [4 /*yield*/, productRepository.save(product)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, productRepository.find({ select: ["name", "label"], order: { name: 1 } })];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("return column on include in select on findAndCount", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var productRepository, product;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    productRepository = connection.getMongoRepository(Product_1.Product);
                    product = new Product_1.Product("test1", "label1", 10);
                    return [4 /*yield*/, productRepository.save(product)];
                case 1:
                    _a.sent();
                    product = new Product_1.Product("test2", "label2", 20);
                    return [4 /*yield*/, productRepository.save(product)];
                case 2:
                    _a.sent();
                    product = new Product_1.Product("test3", "label3", 30);
                    return [4 /*yield*/, productRepository.save(product)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, productRepository.findAndCount({ select: ["name", "label"], order: { name: 1 } })];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("return column on include in select on findByIds", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var productRepository, product, product3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    productRepository = connection.getMongoRepository(Product_1.Product);
                    product = new Product_1.Product("test1", "label1", 10);
                    return [4 /*yield*/, productRepository.save(product)];
                case 1:
                    _a.sent();
                    product = new Product_1.Product("test2", "label2", 20);
                    return [4 /*yield*/, productRepository.save(product)];
                case 2:
                    _a.sent();
                    product = new Product_1.Product("test3", "label3", 30);
                    return [4 /*yield*/, productRepository.save(product)];
                case 3:
                    product3 = _a.sent();
                    return [4 /*yield*/, productRepository.findByIds([product3.id], { select: ["name", "label"], order: { name: 1 } })];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("return column on include in select on findByIds ", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var productRepository, product;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    productRepository = connection.getMongoRepository(Product_1.Product);
                    product = new Product_1.Product("test1", "label1", 10);
                    return [4 /*yield*/, productRepository.save(product)];
                case 1:
                    _a.sent();
                    product = new Product_1.Product("test2", "label2", 20);
                    return [4 /*yield*/, productRepository.save(product)];
                case 2:
                    _a.sent();
                    product = new Product_1.Product("test3", "label3", 30);
                    return [4 /*yield*/, productRepository.findOne({ where: { name: "test2" }, select: ["name", "label"], order: { name: 1 } })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1929.js.map