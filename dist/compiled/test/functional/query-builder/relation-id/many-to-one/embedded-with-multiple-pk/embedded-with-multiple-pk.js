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
describe("query builder > relation-id > many-to-one > embedded-with-multiple-pk", function () {
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
    it("should load ids when loadRelationIdAndMap used on embedded table and each table have primary key", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2, category1, category2, post1, post2, loadedPosts, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User();
                    user1.id = 1;
                    user1.name = "Alice";
                    return [4 /*yield*/, connection.manager.save(user1)];
                case 1:
                    _a.sent();
                    user2 = new User_1.User();
                    user2.id = 2;
                    user2.name = "Bob";
                    return [4 /*yield*/, connection.manager.save(user2)];
                case 2:
                    _a.sent();
                    category1 = new Category_1.Category();
                    category1.id = 1;
                    category1.name = "cars";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 3:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.id = 2;
                    category2.name = "airplanes";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 4:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.id = 1;
                    post1.title = "About BMW";
                    post1.counters = new Counters_1.Counters();
                    post1.counters.code = 111;
                    post1.counters.likes = 1;
                    post1.counters.comments = 2;
                    post1.counters.favorites = 3;
                    post1.counters.category = category1;
                    post1.counters.subcounters = new Subcounters_1.Subcounters();
                    post1.counters.subcounters.version = 1;
                    post1.counters.subcounters.watches = 2;
                    post1.counters.subcounters.watchedUser = user1;
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 5:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.id = 2;
                    post2.title = "About Boeing";
                    post2.counters = new Counters_1.Counters();
                    post2.counters.code = 222;
                    post2.counters.likes = 3;
                    post2.counters.comments = 4;
                    post2.counters.favorites = 5;
                    post2.counters.category = category2;
                    post2.counters.subcounters = new Subcounters_1.Subcounters();
                    post2.counters.subcounters.version = 1;
                    post2.counters.subcounters.watches = 1;
                    post2.counters.subcounters.watchedUser = user2;
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.counters.categoryId", "post.counters.category")
                            .loadRelationIdAndMap("post.counters.subcounters.watchedUserId", "post.counters.subcounters.watchedUser")
                            .orderBy("post.id")
                            .getMany()];
                case 7:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].should.be.eql({
                        id: 1,
                        title: "About BMW",
                        counters: {
                            code: 111,
                            likes: 1,
                            comments: 2,
                            favorites: 3,
                            categoryId: { id: 1, name: "cars" },
                            subcounters: {
                                version: 1,
                                watches: 2,
                                watchedUserId: { id: 1, name: "Alice" }
                            }
                        }
                    }));
                    chai_1.expect(loadedPosts[1].should.be.eql({
                        id: 2,
                        title: "About Boeing",
                        counters: {
                            code: 222,
                            likes: 3,
                            comments: 4,
                            favorites: 5,
                            categoryId: { id: 2, name: "airplanes" },
                            subcounters: {
                                version: 1,
                                watches: 1,
                                watchedUserId: { id: 2, name: "Bob" }
                            }
                        }
                    }));
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .loadRelationIdAndMap("post.counters.categoryId", "post.counters.category")
                            .loadRelationIdAndMap("post.counters.subcounters.watchedUserId", "post.counters.subcounters.watchedUser")
                            .where("post.id = :id", { id: 1 })
                            .andWhere("post.counters.code = :code", { code: 111 })
                            .andWhere("post.counters.subcounters.version = :version", { version: 1 })
                            .getOne()];
                case 8:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.should.be.eql({
                        id: 1,
                        title: "About BMW",
                        counters: {
                            code: 111,
                            likes: 1,
                            comments: 2,
                            favorites: 3,
                            categoryId: { id: 1, name: "cars" },
                            subcounters: {
                                version: 1,
                                watches: 2,
                                watchedUserId: { id: 1, name: "Alice" }
                            }
                        }
                    }));
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=embedded-with-multiple-pk.js.map