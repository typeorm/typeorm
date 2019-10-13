"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var User_1 = require("./entity/User");
var Profile_1 = require("./entity/Profile");
var Editor_1 = require("./entity/Editor");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
describe("relations > eager relations > basic", function () {
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
    function prepareData(connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var profile, user, primaryCategory1, primaryCategory2, secondaryCategory1, secondaryCategory2, post, editor;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        profile = new Profile_1.Profile();
                        profile.about = "I cut trees!";
                        return [4 /*yield*/, connection.manager.save(profile)];
                    case 1:
                        _a.sent();
                        user = new User_1.User();
                        user.firstName = "Timber";
                        user.lastName = "Saw";
                        user.profile = profile;
                        return [4 /*yield*/, connection.manager.save(user)];
                    case 2:
                        _a.sent();
                        primaryCategory1 = new Category_1.Category();
                        primaryCategory1.name = "primary category #1";
                        return [4 /*yield*/, connection.manager.save(primaryCategory1)];
                    case 3:
                        _a.sent();
                        primaryCategory2 = new Category_1.Category();
                        primaryCategory2.name = "primary category #2";
                        return [4 /*yield*/, connection.manager.save(primaryCategory2)];
                    case 4:
                        _a.sent();
                        secondaryCategory1 = new Category_1.Category();
                        secondaryCategory1.name = "secondary category #1";
                        return [4 /*yield*/, connection.manager.save(secondaryCategory1)];
                    case 5:
                        _a.sent();
                        secondaryCategory2 = new Category_1.Category();
                        secondaryCategory2.name = "secondary category #2";
                        return [4 /*yield*/, connection.manager.save(secondaryCategory2)];
                    case 6:
                        _a.sent();
                        post = new Post_1.Post();
                        post.title = "about eager relations";
                        post.categories1 = [primaryCategory1, primaryCategory2];
                        post.categories2 = [secondaryCategory1, secondaryCategory2];
                        post.author = user;
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 7:
                        _a.sent();
                        editor = new Editor_1.Editor();
                        editor.post = post;
                        editor.user = user;
                        return [4 /*yield*/, connection.manager.save(editor)];
                    case 8:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    it("should load all eager relations when object is loaded", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prepareData(connection)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1)];
                case 2:
                    loadedPost = _a.sent();
                    loadedPost.should.be.eql({
                        id: 1,
                        title: "about eager relations",
                        categories1: [{
                                id: 1,
                                name: "primary category #1"
                            }, {
                                id: 2,
                                name: "primary category #2"
                            }],
                        categories2: [{
                                id: 3,
                                name: "secondary category #1"
                            }, {
                                id: 4,
                                name: "secondary category #2"
                            }],
                        author: {
                            id: 1,
                            firstName: "Timber",
                            lastName: "Saw",
                            profile: {
                                id: 1,
                                about: "I cut trees!"
                            }
                        },
                        editors: [{
                                user: {
                                    id: 1,
                                    firstName: "Timber",
                                    lastName: "Saw",
                                    profile: {
                                        id: 1,
                                        about: "I cut trees!"
                                    }
                                }
                            }]
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should not load eager relations when query builder is used", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prepareData(connection)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .where("post.id = :id", { id: 1 })
                            .getOne()];
                case 2:
                    loadedPost = _a.sent();
                    loadedPost.should.be.eql({
                        id: 1,
                        title: "about eager relations"
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=basic-eager-relations.js.map