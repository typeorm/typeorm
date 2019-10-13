"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var test_utils_1 = require("../../utils/test-utils");
var PromiseUtils_1 = require("../../../src/util/PromiseUtils");
describe("entity-model", function () {
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
    it("should save successfully and use static methods successfully", function () { return PromiseUtils_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Post_1.Post.useConnection(connection); // change connection each time because of AR specifics
                    post = Post_1.Post.create();
                    post.title = "About ActiveRecord";
                    post.text = "Huge discussion how good or bad ActiveRecord is.";
                    return [4 /*yield*/, post.save()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, Post_1.Post.findOne(post.id)];
                case 2:
                    loadedPost = _a.sent();
                    loadedPost.should.be.instanceOf(Post_1.Post);
                    loadedPost.id.should.be.eql(post.id);
                    loadedPost.title.should.be.eql("About ActiveRecord");
                    loadedPost.text.should.be.eql("Huge discussion how good or bad ActiveRecord is.");
                    return [2 /*return*/];
            }
        });
    }); }); });
    it("should reload given entity successfully", function () { return PromiseUtils_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category, post, assertCategory, assertReloadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.synchronize(true)];
                case 1:
                    _a.sent();
                    Post_1.Post.useConnection(connection);
                    Category_1.Category.useConnection(connection);
                    category = Category_1.Category.create();
                    category.id = 1;
                    category.name = "Persistence";
                    return [4 /*yield*/, category.save()];
                case 2:
                    _a.sent();
                    post = Post_1.Post.create();
                    post.title = "About ActiveRecord";
                    post.categories = [category];
                    return [4 /*yield*/, post.save()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, post.reload()];
                case 4:
                    _a.sent();
                    assertCategory = Object.assign({}, post.categories[0]);
                    post.should.be.instanceOf(Post_1.Post);
                    post.id.should.be.eql(post.id);
                    post.title.should.be.eql("About ActiveRecord");
                    post.text.should.be.eql("This is default text.");
                    assertCategory.should.be.eql({
                        id: 1,
                        name: "Persistence"
                    });
                    category.name = "Persistence and Entity";
                    return [4 /*yield*/, category.save()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, post.reload()];
                case 6:
                    _a.sent();
                    assertReloadedCategory = Object.assign({}, post.categories[0]);
                    assertReloadedCategory.should.be.eql({
                        id: 1,
                        name: "Persistence and Entity"
                    });
                    return [2 /*return*/];
            }
        });
    }); }); });
});
//# sourceMappingURL=entity-model.js.map