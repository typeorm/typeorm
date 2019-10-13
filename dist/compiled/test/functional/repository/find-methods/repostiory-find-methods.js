"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var EntityNotFoundError_1 = require("../../../../src/error/EntityNotFoundError");
var UserEntity_1 = require("./schema/UserEntity");
describe("repository > find methods", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post, UserEntity_1.UserEntity],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    describe("count", function () {
        var _this = this;
        it("should return a full count when no criteria given", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var postRepository, promises, i, post, savedPosts, count;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        postRepository = connection.getRepository(Post_1.Post);
                        promises = [];
                        for (i = 0; i < 100; i++) {
                            post = new Post_1.Post();
                            post.id = i;
                            post.title = "post #" + i;
                            post.categoryName = "other";
                            promises.push(postRepository.save(post));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedPosts = _a.sent();
                        savedPosts.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, postRepository.count({ order: { id: "ASC" } })];
                    case 2:
                        count = _a.sent();
                        count.should.be.equal(100);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should return a count of posts that match given criteria", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var postRepository, promises, i, post, savedPosts, count;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        postRepository = connection.getRepository(Post_1.Post);
                        promises = [];
                        for (i = 1; i <= 100; i++) {
                            post = new Post_1.Post();
                            post.id = i;
                            post.title = "post #" + i;
                            post.categoryName = i % 2 === 0 ? "even" : "odd";
                            promises.push(postRepository.save(post));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedPosts = _a.sent();
                        savedPosts.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, postRepository.count({
                                where: { categoryName: "odd" },
                                order: { id: "ASC" }
                            })];
                    case 2:
                        count = _a.sent();
                        count.should.be.equal(50);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should return a count of posts that match given multiple criteria", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var postRepository, promises, i, post, savedPosts, count;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        postRepository = connection.getRepository(Post_1.Post);
                        promises = [];
                        for (i = 1; i <= 100; i++) {
                            post = new Post_1.Post();
                            post.id = i;
                            post.title = "post #" + i;
                            post.categoryName = i % 2 === 0 ? "even" : "odd";
                            post.isNew = i > 90;
                            promises.push(postRepository.save(post));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedPosts = _a.sent();
                        savedPosts.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, postRepository.count({
                                where: { categoryName: "odd", isNew: true },
                                order: { id: "ASC" }
                            })];
                    case 2:
                        count = _a.sent();
                        count.should.be.equal(5);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should return a count of posts that match given find options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var postRepository, promises, i, post, savedPosts, count;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        postRepository = connection.getRepository(Post_1.Post);
                        promises = [];
                        for (i = 1; i <= 100; i++) {
                            post = new Post_1.Post();
                            post.id = i;
                            post.isNew = i > 90;
                            post.title = post.isNew ? "new post #" + i : "post #" + i;
                            post.categoryName = i % 2 === 0 ? "even" : "odd";
                            promises.push(postRepository.save(post));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedPosts = _a.sent();
                        savedPosts.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, postRepository.count()];
                    case 2:
                        count = _a.sent();
                        count.should.be.equal(100);
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should return a count of posts that match both criteria and find options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var postRepository, promises, i, post, savedPosts, count;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        postRepository = connection.getRepository(Post_1.Post);
                        promises = [];
                        for (i = 1; i <= 100; i++) {
                            post = new Post_1.Post();
                            post.id = i;
                            post.isNew = i > 90;
                            post.title = post.isNew ? "new post #" + i : "post #" + i;
                            post.categoryName = i % 2 === 0 ? "even" : "odd";
                            promises.push(postRepository.save(post));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedPosts = _a.sent();
                        savedPosts.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, postRepository.count({
                                where: { categoryName: "even", isNew: true },
                                skip: 1,
                                take: 2,
                                order: { id: "ASC" }
                            })];
                    case 2:
                        count = _a.sent();
                        count.should.be.equal(5);
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("find and findAndCount", function () {
        var _this = this;
        it("should return everything when no criteria given", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var postRepository, promises, i, post, savedPosts, loadedPosts, _a, loadedPosts2, count;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        postRepository = connection.getRepository(Post_1.Post);
                        promises = [];
                        for (i = 0; i < 100; i++) {
                            post = new Post_1.Post();
                            post.id = i;
                            post.title = "post #" + i;
                            post.categoryName = "other";
                            promises.push(postRepository.save(post));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedPosts = _b.sent();
                        savedPosts.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, postRepository.find({ order: { id: "ASC" } })];
                    case 2:
                        loadedPosts = _b.sent();
                        loadedPosts.should.be.instanceOf(Array);
                        loadedPosts.length.should.be.equal(100);
                        loadedPosts[0].id.should.be.equal(0);
                        loadedPosts[0].title.should.be.equal("post #0");
                        loadedPosts[99].id.should.be.equal(99);
                        loadedPosts[99].title.should.be.equal("post #99");
                        return [4 /*yield*/, postRepository.findAndCount({ order: { id: "ASC" } })];
                    case 3:
                        _a = tslib_1.__read.apply(void 0, [_b.sent(), 2]), loadedPosts2 = _a[0], count = _a[1];
                        count.should.be.equal(100);
                        loadedPosts2.should.be.instanceOf(Array);
                        loadedPosts2.length.should.be.equal(100);
                        loadedPosts2[0].id.should.be.equal(0);
                        loadedPosts2[0].title.should.be.equal("post #0");
                        loadedPosts2[99].id.should.be.equal(99);
                        loadedPosts2[99].title.should.be.equal("post #99");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should return posts that match given criteria", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var postRepository, promises, i, post, savedPosts, loadedPosts, _a, loadedPosts2, count;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        postRepository = connection.getRepository(Post_1.Post);
                        promises = [];
                        for (i = 1; i <= 100; i++) {
                            post = new Post_1.Post();
                            post.id = i;
                            post.title = "post #" + i;
                            post.categoryName = i % 2 === 0 ? "even" : "odd";
                            promises.push(postRepository.save(post));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedPosts = _b.sent();
                        savedPosts.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, postRepository.find({
                                where: { categoryName: "odd" },
                                order: { id: "ASC" }
                            })];
                    case 2:
                        loadedPosts = _b.sent();
                        loadedPosts.should.be.instanceOf(Array);
                        loadedPosts.length.should.be.equal(50);
                        loadedPosts[0].id.should.be.equal(1);
                        loadedPosts[0].title.should.be.equal("post #1");
                        loadedPosts[49].id.should.be.equal(99);
                        loadedPosts[49].title.should.be.equal("post #99");
                        return [4 /*yield*/, postRepository.findAndCount({
                                where: { categoryName: "odd" },
                                order: { id: "ASC" }
                            })];
                    case 3:
                        _a = tslib_1.__read.apply(void 0, [_b.sent(), 2]), loadedPosts2 = _a[0], count = _a[1];
                        count.should.be.equal(50);
                        loadedPosts2.should.be.instanceOf(Array);
                        loadedPosts2.length.should.be.equal(50);
                        loadedPosts2[0].id.should.be.equal(1);
                        loadedPosts2[0].title.should.be.equal("post #1");
                        loadedPosts2[49].id.should.be.equal(99);
                        loadedPosts2[49].title.should.be.equal("post #99");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should return posts that match given multiple criteria", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var postRepository, promises, i, post, savedPosts, loadedPosts, _a, loadedPosts2, count;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        postRepository = connection.getRepository(Post_1.Post);
                        promises = [];
                        for (i = 1; i <= 100; i++) {
                            post = new Post_1.Post();
                            post.id = i;
                            post.title = "post #" + i;
                            post.categoryName = i % 2 === 0 ? "even" : "odd";
                            post.isNew = i > 90;
                            promises.push(postRepository.save(post));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedPosts = _b.sent();
                        savedPosts.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, postRepository.find({
                                where: { categoryName: "odd", isNew: true },
                                order: { id: "ASC" }
                            })];
                    case 2:
                        loadedPosts = _b.sent();
                        loadedPosts.should.be.instanceOf(Array);
                        loadedPosts.length.should.be.equal(5);
                        loadedPosts[0].id.should.be.equal(91);
                        loadedPosts[0].title.should.be.equal("post #91");
                        loadedPosts[4].id.should.be.equal(99);
                        loadedPosts[4].title.should.be.equal("post #99");
                        return [4 /*yield*/, postRepository.findAndCount({
                                where: { categoryName: "odd", isNew: true },
                                order: { id: "ASC" }
                            })];
                    case 3:
                        _a = tslib_1.__read.apply(void 0, [_b.sent(), 2]), loadedPosts2 = _a[0], count = _a[1];
                        count.should.be.equal(5);
                        loadedPosts2.should.be.instanceOf(Array);
                        loadedPosts2.length.should.be.equal(5);
                        loadedPosts2[0].id.should.be.equal(91);
                        loadedPosts2[0].title.should.be.equal("post #91");
                        loadedPosts2[4].id.should.be.equal(99);
                        loadedPosts2[4].title.should.be.equal("post #99");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should return posts that match given find options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var postRepository, promises, i, post, savedPosts, loadedPosts, _a, loadedPosts2, count;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        postRepository = connection.getRepository(Post_1.Post);
                        promises = [];
                        for (i = 1; i <= 100; i++) {
                            post = new Post_1.Post();
                            post.id = i;
                            post.isNew = i > 90;
                            post.title = post.isNew ? "new post #" + i : "post #" + i;
                            post.categoryName = i % 2 === 0 ? "even" : "odd";
                            promises.push(postRepository.save(post));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedPosts = _b.sent();
                        savedPosts.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, postRepository.createQueryBuilder("post")
                                .where("post.title LIKE :likeTitle AND post.categoryName = :categoryName")
                                .setParameters({
                                likeTitle: "new post #%",
                                categoryName: "even"
                            })
                                .orderBy("post.id", "ASC")
                                .getMany()];
                    case 2:
                        loadedPosts = _b.sent();
                        loadedPosts.should.be.instanceOf(Array);
                        loadedPosts.length.should.be.equal(5);
                        loadedPosts[0].id.should.be.equal(92);
                        loadedPosts[0].title.should.be.equal("new post #92");
                        loadedPosts[4].id.should.be.equal(100);
                        loadedPosts[4].title.should.be.equal("new post #100");
                        return [4 /*yield*/, postRepository.createQueryBuilder("post")
                                .where("post.title LIKE :likeTitle AND post.categoryName = :categoryName")
                                .setParameters({
                                likeTitle: "new post #%",
                                categoryName: "even"
                            })
                                .orderBy("post.id", "ASC")
                                .getManyAndCount()];
                    case 3:
                        _a = tslib_1.__read.apply(void 0, [_b.sent(), 2]), loadedPosts2 = _a[0], count = _a[1];
                        count.should.be.equal(5);
                        loadedPosts2.should.be.instanceOf(Array);
                        loadedPosts2.length.should.be.equal(5);
                        loadedPosts2[0].id.should.be.equal(92);
                        loadedPosts2[0].title.should.be.equal("new post #92");
                        loadedPosts2[4].id.should.be.equal(100);
                        loadedPosts2[4].title.should.be.equal("new post #100");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should return posts that match both criteria and find options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var postRepository, promises, i, post, savedPosts, loadedPosts, _a, loadedPosts2, count;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        postRepository = connection.getRepository(Post_1.Post);
                        promises = [];
                        for (i = 1; i <= 100; i++) {
                            post = new Post_1.Post();
                            post.id = i;
                            post.isNew = i > 90;
                            post.title = post.isNew ? "new post #" + i : "post #" + i;
                            post.categoryName = i % 2 === 0 ? "even" : "odd";
                            promises.push(postRepository.save(post));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedPosts = _b.sent();
                        savedPosts.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, postRepository.find({
                                where: {
                                    categoryName: "even",
                                    isNew: true
                                },
                                skip: 1,
                                take: 2,
                                order: {
                                    id: "ASC"
                                }
                            })];
                    case 2:
                        loadedPosts = _b.sent();
                        loadedPosts.should.be.instanceOf(Array);
                        loadedPosts.length.should.be.equal(2);
                        loadedPosts[0].id.should.be.equal(94);
                        loadedPosts[0].title.should.be.equal("new post #94");
                        loadedPosts[1].id.should.be.equal(96);
                        loadedPosts[1].title.should.be.equal("new post #96");
                        return [4 /*yield*/, postRepository.findAndCount({
                                where: {
                                    categoryName: "even",
                                    isNew: true
                                },
                                skip: 1,
                                take: 2,
                                order: {
                                    id: "ASC"
                                }
                            })];
                    case 3:
                        _a = tslib_1.__read.apply(void 0, [_b.sent(), 2]), loadedPosts2 = _a[0], count = _a[1];
                        count.should.be.equal(5);
                        loadedPosts2.should.be.instanceOf(Array);
                        loadedPosts2.length.should.be.equal(2);
                        loadedPosts2[0].id.should.be.equal(94);
                        loadedPosts2[0].title.should.be.equal("new post #94");
                        loadedPosts2[1].id.should.be.equal(96);
                        loadedPosts2[1].title.should.be.equal("new post #96");
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("findOne", function () {
        var _this = this;
        it("should return first when no criteria given", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var userRepository, promises, i, user, savedUsers, loadedUser;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userRepository = connection.getRepository("User");
                        promises = [];
                        for (i = 0; i < 100; i++) {
                            user = {
                                id: i,
                                firstName: "name #" + i,
                                secondName: "Doe"
                            };
                            promises.push(userRepository.save(user));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedUsers = _a.sent();
                        savedUsers.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, userRepository.findOne({ order: { id: "ASC" } })];
                    case 2:
                        loadedUser = (_a.sent());
                        loadedUser.id.should.be.equal(0);
                        loadedUser.firstName.should.be.equal("name #0");
                        loadedUser.secondName.should.be.equal("Doe");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should return when criteria given", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var userRepository, promises, i, user, savedUsers, loadedUser;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userRepository = connection.getRepository("User");
                        promises = [];
                        for (i = 0; i < 100; i++) {
                            user = {
                                id: i,
                                firstName: "name #" + i,
                                secondName: "Doe"
                            };
                            promises.push(userRepository.save(user));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedUsers = _a.sent();
                        savedUsers.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, userRepository.findOne({ where: { firstName: "name #1" }, order: { id: "ASC" } })];
                    case 2:
                        loadedUser = (_a.sent());
                        loadedUser.id.should.be.equal(1);
                        loadedUser.firstName.should.be.equal("name #1");
                        loadedUser.secondName.should.be.equal("Doe");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should return when find options given", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var userRepository, promises, i, user, savedUsers, loadedUser;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userRepository = connection.getRepository("User");
                        promises = [];
                        for (i = 0; i < 100; i++) {
                            user = {
                                id: i,
                                firstName: "name #" + i,
                                secondName: "Doe"
                            };
                            promises.push(userRepository.save(user));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedUsers = _a.sent();
                        savedUsers.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, userRepository.findOne({
                                where: {
                                    firstName: "name #99",
                                    secondName: "Doe"
                                },
                                order: {
                                    id: "ASC"
                                }
                            })];
                    case 2:
                        loadedUser = _a.sent();
                        loadedUser.id.should.be.equal(99);
                        loadedUser.firstName.should.be.equal("name #99");
                        loadedUser.secondName.should.be.equal("Doe");
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("findOne", function () {
        var _this = this;
        it("should return entity by a given id", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var userRepository, promises, i, user, savedUsers, loadedUser;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userRepository = connection.getRepository("User");
                        promises = [];
                        for (i = 0; i < 100; i++) {
                            user = {
                                id: i,
                                firstName: "name #" + i,
                                secondName: "Doe"
                            };
                            promises.push(userRepository.save(user));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedUsers = _a.sent();
                        savedUsers.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, userRepository.findOne(0)];
                    case 2:
                        loadedUser = (_a.sent());
                        loadedUser.id.should.be.equal(0);
                        loadedUser.firstName.should.be.equal("name #0");
                        loadedUser.secondName.should.be.equal("Doe");
                        return [4 /*yield*/, userRepository.findOne(1)];
                    case 3:
                        loadedUser = (_a.sent());
                        loadedUser.id.should.be.equal(1);
                        loadedUser.firstName.should.be.equal("name #1");
                        loadedUser.secondName.should.be.equal("Doe");
                        return [4 /*yield*/, userRepository.findOne(99)];
                    case 4:
                        loadedUser = (_a.sent());
                        loadedUser.id.should.be.equal(99);
                        loadedUser.firstName.should.be.equal("name #99");
                        loadedUser.secondName.should.be.equal("Doe");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should return entity by a given id and find options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var userRepository, promises, i, user, savedUsers, loadedUser;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userRepository = connection.getRepository("User");
                        promises = [];
                        for (i = 0; i < 100; i++) {
                            user = {
                                id: i,
                                firstName: "name #" + i,
                                secondName: "Doe"
                            };
                            promises.push(userRepository.save(user));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedUsers = _a.sent();
                        savedUsers.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, userRepository.findOne(0, {
                                where: {
                                    secondName: "Doe"
                                }
                            })];
                    case 2:
                        loadedUser = _a.sent();
                        loadedUser.id.should.be.equal(0);
                        loadedUser.firstName.should.be.equal("name #0");
                        loadedUser.secondName.should.be.equal("Doe");
                        return [4 /*yield*/, userRepository.findOne(1, {
                                where: {
                                    secondName: "Dorian"
                                }
                            })];
                    case 3:
                        loadedUser = _a.sent();
                        chai_1.expect(loadedUser).to.be.undefined;
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("findByIds", function () {
        var _this = this;
        it("should return entities by given ids", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var userRepository, users, savedUsers, loadIds, loadedUsers;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userRepository = connection.getRepository("User");
                        users = [1, 2, 3, 4, 5].map(function (id) {
                            return {
                                id: id,
                                firstName: "name #" + id,
                                secondName: "Doe"
                            };
                        });
                        return [4 /*yield*/, userRepository.save(users)];
                    case 1:
                        savedUsers = _a.sent();
                        savedUsers.length.should.be.equal(users.length); // check if they all are saved
                        loadIds = [1, 2, 4];
                        return [4 /*yield*/, userRepository.findByIds(loadIds)];
                    case 2:
                        loadedUsers = (_a.sent());
                        loadedUsers.map(function (user) { return user.id; }).should.be.eql(loadIds);
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("findOneOrFail", function () {
        var _this = this;
        it("should return entity by a given id", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var userRepository, promises, i, user, savedUsers, loadedUser;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userRepository = connection.getRepository("User");
                        promises = [];
                        for (i = 0; i < 100; i++) {
                            user = {
                                id: i,
                                firstName: "name #" + i,
                                secondName: "Doe"
                            };
                            promises.push(userRepository.save(user));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedUsers = _a.sent();
                        savedUsers.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, userRepository.findOneOrFail(0)];
                    case 2:
                        loadedUser = (_a.sent());
                        loadedUser.id.should.be.equal(0);
                        loadedUser.firstName.should.be.equal("name #0");
                        loadedUser.secondName.should.be.equal("Doe");
                        return [4 /*yield*/, userRepository.findOneOrFail(1)];
                    case 3:
                        loadedUser = (_a.sent());
                        loadedUser.id.should.be.equal(1);
                        loadedUser.firstName.should.be.equal("name #1");
                        loadedUser.secondName.should.be.equal("Doe");
                        return [4 /*yield*/, userRepository.findOneOrFail(99)];
                    case 4:
                        loadedUser = (_a.sent());
                        loadedUser.id.should.be.equal(99);
                        loadedUser.firstName.should.be.equal("name #99");
                        loadedUser.secondName.should.be.equal("Doe");
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should return entity by a given id and find options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var userRepository, promises, i, user, savedUsers, loadedUser;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userRepository = connection.getRepository("User");
                        promises = [];
                        for (i = 0; i < 100; i++) {
                            user = {
                                id: i,
                                firstName: "name #" + i,
                                secondName: "Doe"
                            };
                            promises.push(userRepository.save(user));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedUsers = _a.sent();
                        savedUsers.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, userRepository.findOneOrFail(0, {
                                where: {
                                    secondName: "Doe"
                                }
                            })];
                    case 2:
                        loadedUser = _a.sent();
                        loadedUser.id.should.be.equal(0);
                        loadedUser.firstName.should.be.equal("name #0");
                        loadedUser.secondName.should.be.equal("Doe");
                        return [4 /*yield*/, userRepository.findOneOrFail(1, {
                                where: {
                                    secondName: "Dorian"
                                }
                            }).should.eventually.be.rejectedWith(EntityNotFoundError_1.EntityNotFoundError)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })); });
        it("should throw an error if nothing was found", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var userRepository, promises, i, user, savedUsers;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userRepository = connection.getRepository("User");
                        promises = [];
                        for (i = 0; i < 100; i++) {
                            user = {
                                id: i,
                                firstName: "name #" + i,
                                secondName: "Doe"
                            };
                            promises.push(userRepository.save(user));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        savedUsers = _a.sent();
                        savedUsers.length.should.be.equal(100); // check if they all are saved
                        return [4 /*yield*/, userRepository.findOneOrFail(100).should.eventually.be.rejectedWith(EntityNotFoundError_1.EntityNotFoundError)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
});
//# sourceMappingURL=repostiory-find-methods.js.map