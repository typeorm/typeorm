"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Photo_1 = require("./entity/Photo");
var User_1 = require("./entity/User");
var Profile_1 = require("./entity/Profile");
var Category_1 = require("./entity/Category");
var Question_1 = require("./entity/Question");
describe("github issues > #4190 Relation decorators: allow to pass string instead of typeFunction", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should work with one-to-one relations", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var profile, user, users;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    profile = new Profile_1.Profile();
                    profile.gender = "male";
                    profile.photo = "me.jpg";
                    return [4 /*yield*/, connection.manager.save(profile)];
                case 1:
                    _a.sent();
                    user = new User_1.User();
                    user.name = "Joe Smith";
                    user.profile = profile;
                    return [4 /*yield*/, connection.manager.save(user)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(User_1.User, { relations: ["profile"] })];
                case 3:
                    users = _a.sent();
                    users.should.eql([{
                            id: 1,
                            name: "Joe Smith",
                            profile: {
                                id: 1,
                                gender: "male",
                                photo: "me.jpg"
                            }
                        }]);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should work with many-to-one/one-to-many relations", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var photo1, photo2, user, users, photos;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    photo1 = new Photo_1.Photo();
                    photo1.url = "me.jpg";
                    return [4 /*yield*/, connection.manager.save(photo1)];
                case 1:
                    _a.sent();
                    photo2 = new Photo_1.Photo();
                    photo2.url = "me-and-bears.jpg";
                    return [4 /*yield*/, connection.manager.save(photo2)];
                case 2:
                    _a.sent();
                    user = new User_1.User();
                    user.name = "John";
                    user.photos = [photo1, photo2];
                    return [4 /*yield*/, connection.manager.save(user)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(User_1.User, { relations: ["photos"] })];
                case 4:
                    users = _a.sent();
                    return [4 /*yield*/, connection.manager.find(Photo_1.Photo, { relations: ["user"] })];
                case 5:
                    photos = _a.sent();
                    // Check one-to-many
                    users[0].photos.should.have.deep.members([
                        {
                            id: 1,
                            url: "me.jpg"
                        },
                        {
                            id: 2,
                            url: "me-and-bears.jpg"
                        }
                    ]);
                    // Check many-to-one
                    photos.should.have.deep.members([
                        {
                            id: 1,
                            url: "me.jpg",
                            user: {
                                id: 1,
                                name: "John"
                            }
                        },
                        {
                            id: 2,
                            url: "me-and-bears.jpg",
                            user: {
                                id: 1,
                                name: "John"
                            }
                        }
                    ]);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should work with many-to-many relations", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, question, questions;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "animals";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "zoo";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    question = new Question_1.Question();
                    question.categories = [category1, category2];
                    return [4 /*yield*/, connection.manager.save(question)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(Question_1.Question, { relations: ["categories"] })];
                case 4:
                    questions = _a.sent();
                    questions[0].categories.should.have.deep.members([
                        {
                            id: 1,
                            name: "animals"
                        },
                        {
                            id: 2,
                            name: "zoo"
                        }
                    ]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-4190.js.map