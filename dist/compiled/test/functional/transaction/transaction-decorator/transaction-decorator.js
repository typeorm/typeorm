"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
var PostController_1 = require("./controller/PostController");
var Category_1 = require("./entity/Category");
describe("transaction > method wrapped into transaction decorator", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"] // since @Transaction accepts a specific connection name we can use only one connection and its name
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    // create a fake controller
    var controller = new PostController_1.PostController();
    it("should execute all operations in the method in a transaction", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, category, loadedPost, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "successfully saved post";
                    category = new Category_1.Category();
                    category.name = "successfully saved category";
                    // call controller method
                    return [4 /*yield*/, controller.save.apply(controller, [post, category])];
                case 1:
                    // call controller method
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { where: { title: "successfully saved post" } })];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    loadedPost.should.be.eql(post);
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, { where: { name: "successfully saved category" } })];
                case 3:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory).not.to.be.undefined;
                    loadedCategory.should.be.eql(category);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should rollback transaction if any operation in the method failed", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, category, throwError, err_1, loadedPost, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "successfully saved post";
                    category = new Category_1.Category();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, controller.save.apply(controller, [post, category])];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    throwError = err_1;
                    return [3 /*break*/, 4];
                case 4:
                    chai_1.expect(throwError).not.to.be.undefined;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { where: { title: "successfully saved post" } })];
                case 5:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).to.be.undefined;
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, { where: { name: "successfully saved category" } })];
                case 6:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory).to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should rollback transaction if any operation in the method failed", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, category, throwError, err_2, loadedPost, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    category = new Category_1.Category();
                    category.name = "successfully saved category";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, controller.save.apply(controller, [post, category])];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    throwError = err_2;
                    return [3 /*break*/, 4];
                case 4:
                    chai_1.expect(throwError).not.to.be.undefined;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { where: { title: "successfully saved post" } })];
                case 5:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).to.be.undefined;
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, { where: { name: "successfully saved category" } })];
                case 6:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory).to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should save even if second operation failed in method not wrapped into @Transaction decorator", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, category, throwError, err_3, loadedPost, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "successfully saved post";
                    category = new Category_1.Category();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, controller.nonSafeSave.apply(controller, [connection.manager, post, category])];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _a.sent();
                    throwError = err_3;
                    return [3 /*break*/, 4];
                case 4:
                    chai_1.expect(throwError).not.to.be.undefined;
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { where: { title: "successfully saved post" } })];
                case 5:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    loadedPost.should.be.eql(post);
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, { where: { name: "successfully saved category" } })];
                case 6:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory).to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should inject repository and custom repository into method decorated with @Transaction", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, category, savedCategory, loadedPost, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "successfully saved post";
                    category = new Category_1.Category();
                    category.name = "successfully saved category";
                    return [4 /*yield*/, controller.saveWithRepository.apply(controller, [post, category])];
                case 1:
                    savedCategory = _a.sent();
                    // controller should successfully call custom repository method and return the found entity
                    chai_1.expect(savedCategory).not.to.be.undefined;
                    savedCategory.should.be.eql(category);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { where: { title: "successfully saved post" } })];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    loadedPost.should.be.eql(post);
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, { where: { name: "successfully saved category" } })];
                case 3:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory).not.to.be.undefined;
                    loadedCategory.should.be.eql(category);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should execute all operations in the method in a transaction with a specified isolation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, category, loadedPost, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "successfully saved post";
                    category = new Category_1.Category();
                    category.name = "successfully saved category";
                    // call controller method
                    return [4 /*yield*/, controller.saveWithNonDefaultIsolation.apply(controller, [post, category])];
                case 1:
                    // call controller method
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { where: { title: "successfully saved post" } })];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    loadedPost.should.be.eql(post);
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, { where: { name: "successfully saved category" } })];
                case 3:
                    loadedCategory = _a.sent();
                    chai_1.expect(loadedCategory).not.to.be.undefined;
                    loadedCategory.should.be.eql(category);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=transaction-decorator.js.map