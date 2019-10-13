"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var test_utils_1 = require("../../../../utils/test-utils");
var chai_1 = require("chai");
describe("query builder > relational query builder > set operation > many to one relation", function () {
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
    it("should set entity relation of a given entity by entity objects", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, category3, post1, post2, post3, loadedPost1, loadedPost2, loadedPost3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "category #1";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "category #2";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    category3 = new Category_1.Category();
                    category3.name = "category #3";
                    return [4 /*yield*/, connection.manager.save(category3)];
                case 3:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "post #1";
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 4:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "post #2";
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 5:
                    _a.sent();
                    post3 = new Post_1.Post();
                    post3.title = "post #3";
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "category")
                            .of(post1)
                            .set(category1)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["category"] })];
                case 8:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.category).to.be.eql({ id: 1, name: "category #1" });
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["category"] })];
                case 9:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.category).to.be.null;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["category"] })];
                case 10:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.category).to.be.null;
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "category")
                            .of(post1)
                            .set(null)];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["category"] })];
                case 12:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.category).to.be.null;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["category"] })];
                case 13:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.category).to.be.null;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["category"] })];
                case 14:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.category).to.be.null;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should set entity relation of a given entity by entity id", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, category3, post1, post2, post3, loadedPost1, loadedPost2, loadedPost3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "category #1";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "category #2";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    category3 = new Category_1.Category();
                    category3.name = "category #3";
                    return [4 /*yield*/, connection.manager.save(category3)];
                case 3:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "post #1";
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 4:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "post #2";
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 5:
                    _a.sent();
                    post3 = new Post_1.Post();
                    post3.title = "post #3";
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "category")
                            .of(2)
                            .set(2)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["category"] })];
                case 8:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.category).to.be.null;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["category"] })];
                case 9:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.category).to.be.eql({ id: 2, name: "category #2" });
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["category"] })];
                case 10:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.category).to.be.null;
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "category")
                            .of(2)
                            .set(null)];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["category"] })];
                case 12:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.category).to.be.null;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["category"] })];
                case 13:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.category).to.be.null;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["category"] })];
                case 14:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.category).to.be.null;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should set entity relation of a given entity by entity id map", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, category3, post1, post2, post3, loadedPost1, loadedPost2, loadedPost3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "category #1";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "category #2";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    category3 = new Category_1.Category();
                    category3.name = "category #3";
                    return [4 /*yield*/, connection.manager.save(category3)];
                case 3:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "post #1";
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 4:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "post #2";
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 5:
                    _a.sent();
                    post3 = new Post_1.Post();
                    post3.title = "post #3";
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "category")
                            .of({ id: 3 })
                            .set({ id: 3 })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["category"] })];
                case 8:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.category).to.be.null;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["category"] })];
                case 9:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.category).to.be.null;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["category"] })];
                case 10:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.category).to.be.eql({ id: 3, name: "category #3" });
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "category")
                            .of({ id: 3 })
                            .set(null)];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["category"] })];
                case 12:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.category).to.be.null;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["category"] })];
                case 13:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.category).to.be.null;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["category"] })];
                case 14:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.category).to.be.null;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should set entity relation of a multiple entities", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, category3, post1, post2, post3, loadedPost1, loadedPost2, loadedPost3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "category #1";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "category #2";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    category3 = new Category_1.Category();
                    category3.name = "category #3";
                    return [4 /*yield*/, connection.manager.save(category3)];
                case 3:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "post #1";
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 4:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "post #2";
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 5:
                    _a.sent();
                    post3 = new Post_1.Post();
                    post3.title = "post #3";
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "category")
                            .of([{ id: 1 }, { id: 3 }])
                            .set({ id: 3 })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["category"] })];
                case 8:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.category).to.be.eql({ id: 3, name: "category #3" });
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["category"] })];
                case 9:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.category).to.be.null;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["category"] })];
                case 10:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.category).to.be.eql({ id: 3, name: "category #3" });
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "category")
                            .of([{ id: 1 }, { id: 3 }])
                            .set(null)];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["category"] })];
                case 12:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.category).to.be.null;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["category"] })];
                case 13:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.category).to.be.null;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["category"] })];
                case 14:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.category).to.be.null;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=query-builder-relational-set-many-to-one.js.map