"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var User_1 = require("./entity/User");
var Category_1 = require("./entity/Category");
var Post_1 = require("./entity/Post");
var Photo_1 = require("./entity/Photo");
var Counters_1 = require("./entity/Counters");
var FindRelationsNotFoundError_1 = require("../../../../src/error/FindRelationsNotFoundError");
describe("repository > find options > relations", function () {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
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
    // -------------------------------------------------------------------------
    // Setup
    // -------------------------------------------------------------------------
    beforeEach(function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postUser, postCountersUser, photoCountersUser, photoUser, category1, category2, photo1, photo2, photo3, postCounters, post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postUser = new User_1.User();
                    postUser.name = "Timber";
                    return [4 /*yield*/, connection.manager.save(postUser)];
                case 1:
                    _a.sent();
                    postCountersUser = new User_1.User();
                    postCountersUser.name = "Post Counters Timber";
                    return [4 /*yield*/, connection.manager.save(postCountersUser)];
                case 2:
                    _a.sent();
                    photoCountersUser = new User_1.User();
                    photoCountersUser.name = "Photo Counters Timber";
                    return [4 /*yield*/, connection.manager.save(photoCountersUser)];
                case 3:
                    _a.sent();
                    photoUser = new User_1.User();
                    photoUser.name = "Photo Timber";
                    return [4 /*yield*/, connection.manager.save(photoUser)];
                case 4:
                    _a.sent();
                    category1 = new Category_1.Category();
                    category1.name = "category1";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 5:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "category2";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 6:
                    _a.sent();
                    photo1 = new Photo_1.Photo();
                    photo1.filename = "photo1.jpg";
                    photo1.counters = new Counters_1.Counters();
                    photo1.counters.stars = 2;
                    photo1.counters.commentCount = 19;
                    photo1.counters.author = photoCountersUser;
                    photo1.user = photoUser;
                    return [4 /*yield*/, connection.manager.save(photo1)];
                case 7:
                    _a.sent();
                    photo2 = new Photo_1.Photo();
                    photo2.filename = "photo2.jpg";
                    photo2.counters = new Counters_1.Counters();
                    photo2.counters.stars = 3;
                    photo2.counters.commentCount = 20;
                    return [4 /*yield*/, connection.manager.save(photo2)];
                case 8:
                    _a.sent();
                    photo3 = new Photo_1.Photo();
                    photo3.filename = "photo3.jpg";
                    photo3.counters = new Counters_1.Counters();
                    photo3.counters.stars = 4;
                    photo3.counters.commentCount = 21;
                    return [4 /*yield*/, connection.manager.save(photo3)];
                case 9:
                    _a.sent();
                    postCounters = new Counters_1.Counters();
                    postCounters.commentCount = 1;
                    postCounters.author = postCountersUser;
                    postCounters.stars = 101;
                    post = new Post_1.Post();
                    post.title = "About Timber";
                    post.counters = postCounters;
                    post.user = postUser;
                    post.categories = [category1, category2];
                    post.photos = [photo1, photo2, photo3];
                    return [4 /*yield*/, connection.manager.save(post)];
                case 10:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    it("should not any relations if they are not specified", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne(1)];
                case 1:
                    loadedPost = _a.sent();
                    loadedPost.should.be.eql({
                        id: 1,
                        title: "About Timber",
                        counters: {
                            commentCount: 1,
                            stars: 101
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load specified relations case 1", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne(1, { relations: ["photos"] })];
                case 1:
                    loadedPost = _a.sent();
                    loadedPost.id.should.be.equal(1);
                    loadedPost.title.should.be.equal("About Timber");
                    loadedPost.counters.commentCount.should.be.equal(1);
                    loadedPost.counters.stars.should.be.equal(101);
                    loadedPost.photos.should.deep.include({
                        id: 1,
                        filename: "photo1.jpg",
                        counters: {
                            stars: 2,
                            commentCount: 19
                        }
                    });
                    loadedPost.photos.should.deep.include({
                        id: 2,
                        filename: "photo2.jpg",
                        counters: {
                            stars: 3,
                            commentCount: 20
                        }
                    });
                    loadedPost.photos.should.deep.include({
                        id: 3,
                        filename: "photo3.jpg",
                        counters: {
                            stars: 4,
                            commentCount: 21
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load specified relations case 2", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne(1, { relations: ["photos", "user", "categories"] })];
                case 1:
                    loadedPost = _a.sent();
                    loadedPost.id.should.be.equal(1);
                    loadedPost.title.should.be.equal("About Timber");
                    loadedPost.counters.commentCount.should.be.equal(1);
                    loadedPost.counters.stars.should.be.equal(101);
                    loadedPost.photos.should.deep.include({
                        id: 1,
                        filename: "photo1.jpg",
                        counters: {
                            stars: 2,
                            commentCount: 19
                        }
                    });
                    loadedPost.photos.should.deep.include({
                        id: 2,
                        filename: "photo2.jpg",
                        counters: {
                            stars: 3,
                            commentCount: 20
                        }
                    });
                    loadedPost.photos.should.deep.include({
                        id: 3,
                        filename: "photo3.jpg",
                        counters: {
                            stars: 4,
                            commentCount: 21
                        }
                    });
                    loadedPost.user.should.be.eql({
                        id: 1,
                        name: "Timber"
                    });
                    loadedPost.categories.should.deep.include({
                        id: 1,
                        name: "category1"
                    });
                    loadedPost.categories.should.deep.include({
                        id: 2,
                        name: "category2"
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load specified relations and their sub-relations case 1", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne(1, { relations: ["photos", "user", "categories", "photos.user"] })];
                case 1:
                    loadedPost = _a.sent();
                    loadedPost.id.should.be.equal(1);
                    loadedPost.title.should.be.equal("About Timber");
                    loadedPost.counters.commentCount.should.be.equal(1);
                    loadedPost.counters.stars.should.be.equal(101);
                    loadedPost.photos.should.deep.include({
                        id: 1,
                        filename: "photo1.jpg",
                        counters: {
                            stars: 2,
                            commentCount: 19
                        },
                        user: {
                            id: 4,
                            name: "Photo Timber"
                        }
                    });
                    loadedPost.photos.should.deep.include({
                        id: 2,
                        filename: "photo2.jpg",
                        counters: {
                            stars: 3,
                            commentCount: 20
                        },
                        user: null
                    });
                    loadedPost.photos.should.deep.include({
                        id: 3,
                        filename: "photo3.jpg",
                        counters: {
                            stars: 4,
                            commentCount: 21
                        },
                        user: null
                    });
                    loadedPost.user.should.be.eql({
                        id: 1,
                        name: "Timber"
                    });
                    loadedPost.categories.should.deep.include({
                        id: 1,
                        name: "category1"
                    });
                    loadedPost.categories.should.deep.include({
                        id: 2,
                        name: "category2"
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load specified relations and their sub-relations case 2", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne(1, { relations: ["photos", "user", "photos.user", "counters.author"] })];
                case 1:
                    loadedPost = _a.sent();
                    loadedPost.id.should.be.equal(1);
                    loadedPost.title.should.be.equal("About Timber");
                    loadedPost.counters.commentCount.should.be.equal(1);
                    loadedPost.counters.stars.should.be.equal(101);
                    loadedPost.photos.should.deep.include({
                        id: 1,
                        filename: "photo1.jpg",
                        counters: {
                            stars: 2,
                            commentCount: 19
                        },
                        user: {
                            id: 4,
                            name: "Photo Timber"
                        }
                    });
                    loadedPost.photos.should.deep.include({
                        id: 2,
                        filename: "photo2.jpg",
                        counters: {
                            stars: 3,
                            commentCount: 20
                        },
                        user: null
                    });
                    loadedPost.photos.should.deep.include({
                        id: 3,
                        filename: "photo3.jpg",
                        counters: {
                            stars: 4,
                            commentCount: 21
                        },
                        user: null
                    });
                    loadedPost.user.should.be.eql({
                        id: 1,
                        name: "Timber"
                    });
                    loadedPost.counters.author.should.be.eql({
                        id: 2,
                        name: "Post Counters Timber"
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load specified relations and their sub-relations case 3", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne(1, { relations: ["photos", "user", "photos.user", "counters.author", "photos.counters.author"] })];
                case 1:
                    loadedPost = _a.sent();
                    loadedPost.id.should.be.equal(1);
                    loadedPost.title.should.be.equal("About Timber");
                    loadedPost.counters.commentCount.should.be.equal(1);
                    loadedPost.counters.stars.should.be.equal(101);
                    loadedPost.photos.should.deep.include({
                        id: 1,
                        filename: "photo1.jpg",
                        counters: {
                            stars: 2,
                            commentCount: 19,
                            author: {
                                id: 3,
                                name: "Photo Counters Timber"
                            }
                        },
                        user: {
                            id: 4,
                            name: "Photo Timber"
                        }
                    });
                    loadedPost.photos.should.deep.include({
                        id: 2,
                        filename: "photo2.jpg",
                        counters: {
                            stars: 3,
                            commentCount: 20,
                            author: null
                        },
                        user: null
                    });
                    loadedPost.photos.should.deep.include({
                        id: 3,
                        filename: "photo3.jpg",
                        counters: {
                            stars: 4,
                            commentCount: 21,
                            author: null
                        },
                        user: null
                    });
                    loadedPost.user.should.be.eql({
                        id: 1,
                        name: "Timber"
                    });
                    loadedPost.counters.author.should.be.eql({
                        id: 2,
                        name: "Post Counters Timber"
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should throw error if specified relations were not found case 1", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne(1, { relations: ["photos2"] }).should.eventually.be.rejectedWith(FindRelationsNotFoundError_1.FindRelationsNotFoundError)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should throw error if specified relations were not found case 2", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne(1, { relations: ["photos", "counters.author2"] }).should.eventually.be.rejectedWith(FindRelationsNotFoundError_1.FindRelationsNotFoundError)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should throw error if specified relations were not found case 3", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne(1, { relations: ["photos", "counters2.author"] }).should.eventually.be.rejectedWith(FindRelationsNotFoundError_1.FindRelationsNotFoundError)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should throw error if specified relations were not found case 4", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne(1, { relations: ["photos", "photos.user.haha"] }).should.eventually.be.rejectedWith(FindRelationsNotFoundError_1.FindRelationsNotFoundError)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should throw error if specified relations were not found case 5", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne(1, { relations: ["questions"] }).should.eventually.be.rejectedWith(FindRelationsNotFoundError_1.FindRelationsNotFoundError)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should throw error if specified relations were not found case 6", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne(1, { relations: ["questions.haha"] }).should.eventually.be.rejectedWith(FindRelationsNotFoundError_1.FindRelationsNotFoundError)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=repository-find-options-relations.js.map