"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var Category_1 = require("./entity/Category");
var test_utils_1 = require("../../../utils/test-utils");
describe("tree tables > materialized-path", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Category_1.Category],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("attach should work properly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var categoryRepository, a1, a11, a111, a12, rootCategories, a11Parent, a1Children;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    categoryRepository = connection.getTreeRepository(Category_1.Category);
                    a1 = new Category_1.Category();
                    a1.name = "a1";
                    return [4 /*yield*/, categoryRepository.save(a1)];
                case 1:
                    _a.sent();
                    a11 = new Category_1.Category();
                    a11.name = "a11";
                    a11.parentCategory = a1;
                    return [4 /*yield*/, categoryRepository.save(a11)];
                case 2:
                    _a.sent();
                    a111 = new Category_1.Category();
                    a111.name = "a111";
                    a111.parentCategory = a11;
                    return [4 /*yield*/, categoryRepository.save(a111)];
                case 3:
                    _a.sent();
                    a12 = new Category_1.Category();
                    a12.name = "a12";
                    a12.parentCategory = a1;
                    return [4 /*yield*/, categoryRepository.save(a12)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.findRoots()];
                case 5:
                    rootCategories = _a.sent();
                    rootCategories.should.be.eql([{
                            id: 1,
                            name: "a1"
                        }]);
                    return [4 /*yield*/, categoryRepository.findAncestors(a11)];
                case 6:
                    a11Parent = _a.sent();
                    a11Parent.length.should.be.equal(2);
                    a11Parent.should.deep.include({ id: 1, name: "a1" });
                    a11Parent.should.deep.include({ id: 2, name: "a11" });
                    return [4 /*yield*/, categoryRepository.findDescendants(a1)];
                case 7:
                    a1Children = _a.sent();
                    a1Children.length.should.be.equal(4);
                    a1Children.should.deep.include({ id: 1, name: "a1" });
                    a1Children.should.deep.include({ id: 2, name: "a11" });
                    a1Children.should.deep.include({ id: 3, name: "a111" });
                    a1Children.should.deep.include({ id: 4, name: "a12" });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("categories should be attached via children and saved properly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var categoryRepository, a1, a11, a12, rootCategories, a11Parent, a1Children;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    categoryRepository = connection.getTreeRepository(Category_1.Category);
                    a1 = new Category_1.Category();
                    a1.name = "a1";
                    return [4 /*yield*/, categoryRepository.save(a1)];
                case 1:
                    _a.sent();
                    a11 = new Category_1.Category();
                    a11.name = "a11";
                    a12 = new Category_1.Category();
                    a12.name = "a12";
                    a1.childCategories = [a11, a12];
                    return [4 /*yield*/, categoryRepository.save(a1)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.findRoots()];
                case 3:
                    rootCategories = _a.sent();
                    rootCategories.should.be.eql([{
                            id: 1,
                            name: "a1"
                        }]);
                    return [4 /*yield*/, categoryRepository.findAncestors(a11)];
                case 4:
                    a11Parent = _a.sent();
                    a11Parent.length.should.be.equal(2);
                    a11Parent.should.deep.include({ id: 1, name: "a1" });
                    a11Parent.should.deep.include({ id: 2, name: "a11" });
                    return [4 /*yield*/, categoryRepository.findDescendants(a1)];
                case 5:
                    a1Children = _a.sent();
                    a1Children.length.should.be.equal(3);
                    a1Children.should.deep.include({ id: 1, name: "a1" });
                    a1Children.should.deep.include({ id: 2, name: "a11" });
                    a1Children.should.deep.include({ id: 3, name: "a12" });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("categories should be attached via children and saved properly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var categoryRepository, a1, a11, a12, rootCategories, a11Parent, a1Children;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    categoryRepository = connection.getTreeRepository(Category_1.Category);
                    a1 = new Category_1.Category();
                    a1.name = "a1";
                    return [4 /*yield*/, categoryRepository.save(a1)];
                case 1:
                    _a.sent();
                    a11 = new Category_1.Category();
                    a11.name = "a11";
                    a12 = new Category_1.Category();
                    a12.name = "a12";
                    a1.childCategories = [a11, a12];
                    return [4 /*yield*/, categoryRepository.save(a1)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.findRoots()];
                case 3:
                    rootCategories = _a.sent();
                    rootCategories.should.be.eql([{
                            id: 1,
                            name: "a1"
                        }]);
                    return [4 /*yield*/, categoryRepository.findAncestors(a11)];
                case 4:
                    a11Parent = _a.sent();
                    a11Parent.length.should.be.equal(2);
                    a11Parent.should.deep.include({ id: 1, name: "a1" });
                    a11Parent.should.deep.include({ id: 2, name: "a11" });
                    return [4 /*yield*/, categoryRepository.findDescendants(a1)];
                case 5:
                    a1Children = _a.sent();
                    a1Children.length.should.be.equal(3);
                    a1Children.should.deep.include({ id: 1, name: "a1" });
                    a1Children.should.deep.include({ id: 2, name: "a11" });
                    a1Children.should.deep.include({ id: 3, name: "a12" });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("categories should be attached via children and saved properly and everything must be saved in cascades", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var categoryRepository, a1, a11, a12, a111, a112, rootCategories, a11Parent, a1Children, a1ChildrenNames;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    categoryRepository = connection.getTreeRepository(Category_1.Category);
                    a1 = new Category_1.Category();
                    a1.name = "a1";
                    a11 = new Category_1.Category();
                    a11.name = "a11";
                    a12 = new Category_1.Category();
                    a12.name = "a12";
                    a111 = new Category_1.Category();
                    a111.name = "a111";
                    a112 = new Category_1.Category();
                    a112.name = "a112";
                    a1.childCategories = [a11, a12];
                    a11.childCategories = [a111, a112];
                    return [4 /*yield*/, categoryRepository.save(a1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.findRoots()];
                case 2:
                    rootCategories = _a.sent();
                    rootCategories.should.be.eql([{
                            id: 1,
                            name: "a1"
                        }]);
                    return [4 /*yield*/, categoryRepository.findAncestors(a11)];
                case 3:
                    a11Parent = _a.sent();
                    a11Parent.length.should.be.equal(2);
                    a11Parent.should.deep.include({ id: 1, name: "a1" });
                    a11Parent.should.deep.include({ id: 2, name: "a11" });
                    return [4 /*yield*/, categoryRepository.findDescendants(a1)];
                case 4:
                    a1Children = _a.sent();
                    a1ChildrenNames = a1Children.map(function (child) { return child.name; });
                    a1ChildrenNames.length.should.be.equal(5);
                    a1ChildrenNames.should.deep.include("a1");
                    a1ChildrenNames.should.deep.include("a11");
                    a1ChildrenNames.should.deep.include("a12");
                    a1ChildrenNames.should.deep.include("a111");
                    a1ChildrenNames.should.deep.include("a112");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=materialized-path.js.map