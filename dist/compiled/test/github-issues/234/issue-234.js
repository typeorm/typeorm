"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
var Category_1 = require("./entity/Category");
var Tag_1 = require("./entity/Tag");
describe("github issues > #234 and #223 lazy loading does not work correctly from one-to-many and many-to-many sides", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"] // we can properly test lazy-relations only on one platform
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly load from one-to-many and many-to-one sides", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var promises, i, post, category, category1, post1, category2, post2, loadedPosts, loadedCategory1, loadedCategory2, loadedPosts1, loadedPosts2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promises = [];
                    for (i = 1; i <= 10; i++) {
                        post = new Post_1.Post();
                        post.title = "fake post # " + i;
                        if (i > 5) {
                            category = new Category_1.Category();
                            category.name = "fake category!";
                            post.category = Promise.resolve(category);
                        }
                        promises.push(connection.manager.save(post));
                    }
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    _a.sent();
                    category1 = new Category_1.Category();
                    category1.name = "category #1";
                    post1 = new Post_1.Post();
                    post1.title = "Hello Post #1";
                    post1.category = Promise.resolve(category1);
                    category2 = new Category_1.Category();
                    category2.name = "category #2";
                    post2 = new Post_1.Post();
                    post2.title = "Hello Post #2";
                    post2.category = Promise.resolve(category2);
                    // persist
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 2:
                    // persist
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .where("post.title = :firstTitle OR post.title = :secondTitle", { firstTitle: "Hello Post #1", secondTitle: "Hello Post #2" })
                            .getMany()];
                case 4:
                    loadedPosts = _a.sent();
                    return [4 /*yield*/, loadedPosts[0].category];
                case 5:
                    loadedCategory1 = _a.sent();
                    chai_1.expect(loadedCategory1).not.to.be.undefined;
                    loadedCategory1.name.should.equal("category #1");
                    return [4 /*yield*/, loadedPosts[1].category];
                case 6:
                    loadedCategory2 = _a.sent();
                    chai_1.expect(loadedCategory2).not.to.be.undefined;
                    loadedCategory2.name.should.equal("category #2");
                    return [4 /*yield*/, loadedCategory1.posts];
                case 7:
                    loadedPosts1 = _a.sent();
                    chai_1.expect(loadedPosts1).not.to.be.undefined;
                    loadedPosts1[0].title.should.equal("Hello Post #1");
                    return [4 /*yield*/, loadedCategory2.posts];
                case 8:
                    loadedPosts2 = _a.sent();
                    chai_1.expect(loadedPosts2).not.to.be.undefined;
                    loadedPosts2[0].title.should.equal("Hello Post #2");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should correctly load from both many-to-many sides", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var promises, i, post, j, tag, _a, _b, _c, tag1_1, tag1_2, post1, tag2_1, tag2_2, tag2_3, post2, loadedPosts, loadedTags1, loadedTags2, loadedPosts1, loadedPosts2;
        return tslib_1.__generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    promises = [];
                    i = 1;
                    _d.label = 1;
                case 1:
                    if (!(i <= 10)) return [3 /*break*/, 7];
                    post = new Post_1.Post();
                    post.title = "fake post # " + i;
                    j = 1;
                    _d.label = 2;
                case 2:
                    if (!(j <= i)) return [3 /*break*/, 5];
                    tag = new Tag_1.Tag();
                    tag.name = "fake tag!";
                    _a = post;
                    _c = (_b = Promise).resolve;
                    return [4 /*yield*/, post.tags];
                case 3:
                    _a.tags = _c.apply(_b, [(_d.sent()).concat([tag])]);
                    _d.label = 4;
                case 4:
                    j++;
                    return [3 /*break*/, 2];
                case 5:
                    promises.push(connection.manager.save(post));
                    _d.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 1];
                case 7: return [4 /*yield*/, Promise.all(promises)];
                case 8:
                    _d.sent();
                    tag1_1 = new Tag_1.Tag();
                    tag1_1.name = "tag #1_1";
                    tag1_2 = new Tag_1.Tag();
                    tag1_2.name = "tag #1_2";
                    post1 = new Post_1.Post();
                    post1.title = "Hello Post #1";
                    post1.tags = Promise.resolve([tag1_1, tag1_2]);
                    tag2_1 = new Tag_1.Tag();
                    tag2_1.name = "tag #2_1";
                    tag2_2 = new Tag_1.Tag();
                    tag2_2.name = "tag #2_2";
                    tag2_3 = new Tag_1.Tag();
                    tag2_3.name = "tag #2_3";
                    post2 = new Post_1.Post();
                    post2.title = "Hello Post #2";
                    post2.tags = Promise.resolve([tag2_1, tag2_2, tag2_3]);
                    // persist
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 9:
                    // persist
                    _d.sent();
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 10:
                    _d.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .where("post.title = :firstTitle OR post.title = :secondTitle", { firstTitle: "Hello Post #1", secondTitle: "Hello Post #2" })
                            .getMany()];
                case 11:
                    loadedPosts = _d.sent();
                    return [4 /*yield*/, loadedPosts[0].tags];
                case 12:
                    loadedTags1 = _d.sent();
                    chai_1.expect(loadedTags1).not.to.be.undefined;
                    loadedTags1.length.should.be.equal(2);
                    loadedTags1[0].name.should.equal("tag #1_1");
                    loadedTags1[1].name.should.equal("tag #1_2");
                    return [4 /*yield*/, loadedPosts[1].tags];
                case 13:
                    loadedTags2 = _d.sent();
                    chai_1.expect(loadedTags2).not.to.be.undefined;
                    loadedTags2.length.should.be.equal(3);
                    loadedTags2[0].name.should.equal("tag #2_1");
                    loadedTags2[1].name.should.equal("tag #2_2");
                    loadedTags2[2].name.should.equal("tag #2_3");
                    return [4 /*yield*/, loadedTags1[0].posts];
                case 14:
                    loadedPosts1 = _d.sent();
                    chai_1.expect(loadedPosts1).not.to.be.undefined;
                    loadedPosts1.length.should.be.equal(1);
                    loadedPosts1[0].title.should.equal("Hello Post #1");
                    return [4 /*yield*/, loadedTags2[0].posts];
                case 15:
                    loadedPosts2 = _d.sent();
                    chai_1.expect(loadedPosts2).not.to.be.undefined;
                    loadedPosts2.length.should.be.equal(1);
                    loadedPosts2[0].title.should.equal("Hello Post #2");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-234.js.map