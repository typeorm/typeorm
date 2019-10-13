"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Category_1 = require("./entity/Category");
describe("github issues > #3783 Tree functionality broken", function () {
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
    it("should work correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var categoryRepository, a1, b1, c1, c11, c12, roots, c1Tree;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    categoryRepository = connection.getTreeRepository(Category_1.Category);
                    a1 = new Category_1.Category();
                    a1.name = "a1";
                    b1 = new Category_1.Category();
                    b1.name = "b1";
                    c1 = new Category_1.Category();
                    c1.name = "c1";
                    c11 = new Category_1.Category();
                    c11.name = "c11";
                    c12 = new Category_1.Category();
                    c12.name = "c12";
                    c11.parentCategory = c1;
                    c12.parentCategory = c1;
                    return [4 /*yield*/, categoryRepository.save(a1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.save(b1)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.save(c1)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.save(c11)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.save(c12)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.findRoots()];
                case 6:
                    roots = _a.sent();
                    roots.length.should.be.eql(3);
                    return [4 /*yield*/, categoryRepository.findDescendantsTree(c1)];
                case 7:
                    c1Tree = _a.sent();
                    c1Tree.should.be.equal(c1);
                    c1Tree.childCategories.length.should.be.eql(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-3783.js.map