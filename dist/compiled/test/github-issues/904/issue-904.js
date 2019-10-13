"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Category_1 = require("./entity/Category");
describe("github issues > #904 Using closure tables without @TreeLevelColumn will always fail on insert", function () {
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
    it("should work correctly when saving using parent category", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
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
                    roots.should.be.eql([
                        {
                            id: 1,
                            name: "a1",
                        },
                        {
                            id: 2,
                            name: "b1",
                        },
                        {
                            id: 3,
                            name: "c1",
                        },
                    ]);
                    return [4 /*yield*/, categoryRepository.findDescendantsTree(c1)];
                case 7:
                    c1Tree = _a.sent();
                    c1Tree.should.be.equal(c1);
                    c1Tree.should.be.eql({
                        id: 3,
                        name: "c1",
                        childCategories: [{
                                id: 4,
                                name: "c11",
                                childCategories: []
                            }, {
                                id: 5,
                                name: "c12",
                                childCategories: []
                            }]
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should work correctly when saving using children categories", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
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
                    c1.childCategories = [c11];
                    return [4 /*yield*/, categoryRepository.save(a1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.save(b1)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.save(c1)];
                case 3:
                    _a.sent();
                    c1.childCategories.push(c12);
                    return [4 /*yield*/, categoryRepository.save(c1)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.findRoots()];
                case 5:
                    roots = _a.sent();
                    roots.should.be.eql([
                        {
                            id: 1,
                            name: "a1",
                        },
                        {
                            id: 2,
                            name: "b1",
                        },
                        {
                            id: 3,
                            name: "c1",
                        },
                    ]);
                    return [4 /*yield*/, categoryRepository.findDescendantsTree(c1)];
                case 6:
                    c1Tree = _a.sent();
                    c1Tree.should.be.equal(c1);
                    c1Tree.should.be.eql({
                        id: 3,
                        name: "c1",
                        childCategories: [{
                                id: 4,
                                name: "c11",
                                childCategories: []
                            }, {
                                id: 5,
                                name: "c12",
                                childCategories: []
                            }]
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be able to retrieve the whole tree", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var categoryRepository, a1, b1, c1, c11, c12, tree;
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
                    c1.childCategories = [c11];
                    return [4 /*yield*/, categoryRepository.save(a1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.save(b1)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.save(c1)];
                case 3:
                    _a.sent();
                    c1.childCategories.push(c12);
                    return [4 /*yield*/, categoryRepository.save(c1)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.findTrees()];
                case 5:
                    tree = _a.sent();
                    tree.should.be.eql([
                        {
                            id: 1,
                            name: "a1",
                            childCategories: []
                        },
                        {
                            id: 2,
                            name: "b1",
                            childCategories: []
                        },
                        {
                            id: 3,
                            name: "c1",
                            childCategories: [{
                                    id: 4,
                                    name: "c11",
                                    childCategories: []
                                }, {
                                    id: 5,
                                    name: "c12",
                                    childCategories: []
                                }]
                        }
                    ]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-904.js.map