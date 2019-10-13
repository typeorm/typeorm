"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../../utils/test-utils");
var Category_1 = require("./entity/Category");
var Post_1 = require("./entity/Post");
describe("decorators > relation-id > one-to-many", function () {
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
    it("should load id when RelationId decorator used", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category, category2, post1, post2, post3, loadedCategories, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category = new Category_1.Category();
                    category.id = 1;
                    category.name = "cars";
                    return [4 /*yield*/, connection.manager.save(category)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.id = 2;
                    category2.name = "airplanes";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.id = 1;
                    post1.title = "about BMW";
                    post1.category = category;
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 3:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.id = 2;
                    post2.title = "about Audi";
                    post2.category = category;
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 4:
                    _a.sent();
                    post3 = new Post_1.Post();
                    post3.id = 3;
                    post3.title = "about Boeing";
                    post3.category = category2;
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Category_1.Category, "category")
                            .orderBy("category.id")
                            .getMany()];
                case 6:
                    loadedCategories = _a.sent();
                    chai_1.expect(loadedCategories[0].postIds.length).to.be.equal(2);
                    chai_1.expect(loadedCategories[0].postIds[0]).to.be.equal(1);
                    chai_1.expect(loadedCategories[0].postIds[1]).to.be.equal(2);
                    chai_1.expect(loadedCategories[1].postIds.length).to.be.equal(1);
                    chai_1.expect(loadedCategories[1].postIds[0]).to.be.equal(3);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Category_1.Category, "category")
                            .where("category.id = :id", { id: 1 })
                            .getOne()];
                case 7:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory.postIds.length).to.be.equal(2);
                    chai_1.expect(loadedCategory.postIds[0]).to.be.equal(1);
                    chai_1.expect(loadedCategory.postIds[1]).to.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load id when RelationId decorator used with additional condition", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category, category2, post1, post2, post3, loadedCategories, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category = new Category_1.Category();
                    category.id = 1;
                    category.name = "cars";
                    return [4 /*yield*/, connection.manager.save(category)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.id = 2;
                    category2.name = "airplanes";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.id = 1;
                    post1.title = "about BMW";
                    post1.category = category;
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 3:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.id = 2;
                    post2.title = "about Audi";
                    post2.category = category;
                    post2.isRemoved = true;
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 4:
                    _a.sent();
                    post3 = new Post_1.Post();
                    post3.id = 3;
                    post3.title = "about Boeing";
                    post3.category = category2;
                    post3.isRemoved = true;
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Category_1.Category, "category")
                            .orderBy("category.id")
                            .getMany()];
                case 6:
                    loadedCategories = _a.sent();
                    chai_1.expect(loadedCategories[0].removedPostIds).to.not.be.eql([]);
                    chai_1.expect(loadedCategories[0].removedPostIds.length).to.be.equal(1);
                    chai_1.expect(loadedCategories[0].removedPostIds[0]).to.be.equal(2);
                    chai_1.expect(loadedCategories[1].removedPostIds[0]).to.be.equal(3);
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Category_1.Category, "category")
                            .where("category.id = :id", { id: 1 })
                            .getOne()];
                case 7:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory.removedPostIds).to.not.be.eql([]);
                    chai_1.expect(loadedCategory.removedPostIds.length).to.be.equal(1);
                    chai_1.expect(loadedCategory.removedPostIds[0]).to.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=relation-id-decorator-one-to-many.js.map