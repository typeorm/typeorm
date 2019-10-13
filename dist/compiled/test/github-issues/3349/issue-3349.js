"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Category_1 = require("./entity/Category");
var src_1 = require("../../../src");
var chai_1 = require("chai");
describe("github issues > #3349 Multiple where conditions with parameters", function () {
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
    it("should work with query builder", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var repository, category, result;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    repository = connection.getRepository(Category_1.Category);
                    category = new Category_1.Category();
                    category.id = 1;
                    category.myField = 2;
                    return [4 /*yield*/, repository.save(category)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .select("category")
                            .from(Category_1.Category, "category")
                            .where("category.id = :ida", { ida: 1 })
                            .orWhereInIds([2])
                            .orWhereInIds([3])
                            .execute()];
                case 2:
                    result = _a.sent();
                    chai_1.expect(result).lengthOf(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should work with findOne", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var repository, category, result;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    repository = connection.getRepository(Category_1.Category);
                    category = new Category_1.Category();
                    category.id = 1;
                    category.myField = 2;
                    return [4 /*yield*/, repository.save(category)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, repository.findOne(1, {
                            where: {
                                myField: src_1.In([2, 3]),
                            },
                        })];
                case 2:
                    result = _a.sent();
                    chai_1.expect(result).to.not.be.null;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-3349.js.map