"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var Counters_1 = require("./entity/Counters");
var User_1 = require("./entity/User");
var Subcounters_1 = require("./entity/Subcounters");
describe("query builder > relation-id > one-to-many > embedded", function () {
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
    it("should load ids when loadRelationIdAndMap used on embedded and nested embedded tables", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2, user3, category1, category2, category3, category4, post1, post2, loadedPosts;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User();
                    user1.name = "Alice";
                    return [4 /*yield*/, connection.manager.save(user1)];
                case 1:
                    _a.sent();
                    user2 = new User_1.User();
                    user2.name = "Bob";
                    return [4 /*yield*/, connection.manager.save(user2)];
                case 2:
                    _a.sent();
                    user3 = new User_1.User();
                    user3.name = "Clara";
                    return [4 /*yield*/, connection.manager.save(user3)];
                case 3:
                    _a.sent();
                    category1 = new Category_1.Category();
                    category1.name = "cars";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 4:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "BMW";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 5:
                    _a.sent();
                    category3 = new Category_1.Category();
                    category3.name = "airplanes";
                    return [4 /*yield*/, connection.manager.save(category3)];
                case 6:
                    _a.sent();
                    category4 = new Category_1.Category();
                    category4.name = "Boeing";
                    return [4 /*yield*/, connection.manager.save(category4)];
                case 7:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "About BMW";
                    post1.counters = new Counters_1.Counters();
                    post1.counters.likes = 1;
                    post1.counters.comments = 2;
                    post1.counters.favorites = 3;
                    post1.counters.categories = [category1, category2];
                    post1.counters.subcounters = new Subcounters_1.Subcounters();
                    post1.counters.subcounters.version = 1;
                    post1.counters.subcounters.watches = 2;
                    post1.counters.subcounters.watchedUsers = [user1, user2];
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 8:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "About Boeing";
                    post2.counters = new Counters_1.Counters();
                    post2.counters.likes = 3;
                    post2.counters.comments = 4;
                    post2.counters.favorites = 5;
                    post2.counters.categories = [category3, category4];
                    post2.counters.subcounters = new Subcounters_1.Subcounters();
                    post2.counters.subcounters.version = 1;
                    post2.counters.subcounters.watches = 1;
                    post2.counters.subcounters.watchedUsers = [user3];
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.counters.categoryIds", "post.counters.categories")
                            .loadRelationIdAndMap("post.counters.subcounters.watchedUserIds", "post.counters.subcounters.watchedUsers")
                            .orderBy("post.id")
                            .getMany()];
                case 10:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].should.be.eql({
                        title: "About BMW",
                        counters: {
                            likes: 1,
                            comments: 2,
                            favorites: 3,
                            categoryIds: [1, 2],
                            subcounters: {
                                id: 1,
                                version: 1,
                                watches: 2,
                                watchedUserIds: [1, 2]
                            }
                        }
                    }));
                    chai_1.expect(loadedPosts[1].should.be.eql({
                        title: "About Boeing",
                        counters: {
                            likes: 3,
                            comments: 4,
                            favorites: 5,
                            categoryIds: [3, 4],
                            subcounters: {
                                id: 2,
                                version: 1,
                                watches: 1,
                                watchedUserIds: [3]
                            }
                        }
                    }));
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=embedded.js.map