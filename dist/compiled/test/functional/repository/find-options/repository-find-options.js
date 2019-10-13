"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var User_1 = require("./entity/User");
var Category_1 = require("./entity/Category");
var Post_1 = require("./entity/Post");
var Photo_1 = require("./entity/Photo");
describe("repository > find options", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["sqlite"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should load relations", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user, category, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = new User_1.User();
                    user.name = "Alex Messer";
                    return [4 /*yield*/, connection.manager.save(user)];
                case 1:
                    _a.sent();
                    category = new Category_1.Category();
                    category.name = "Boys";
                    return [4 /*yield*/, connection.manager.save(category)];
                case 2:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "About Alex Messer";
                    post.author = user;
                    post.categories = [category];
                    return [4 /*yield*/, connection.manager.save(post)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Post_1.Post).findOne({
                            relations: ["author", "categories"]
                        })];
                case 4:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).to.be.eql({
                        id: 1,
                        title: "About Alex Messer",
                        author: {
                            id: 1,
                            name: "Alex Messer"
                        },
                        categories: [{
                                id: 1,
                                name: "Boys"
                            }]
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should select specific columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category, categories, photos, i, photo, loadedPhoto, loadedPhotos1, loadedPhotos2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category = new Category_1.Category();
                    category.name = "Bears";
                    return [4 /*yield*/, connection.manager.save(category)];
                case 1:
                    _a.sent();
                    categories = [category];
                    photos = [];
                    i = 1;
                    _a.label = 2;
                case 2:
                    if (!(i < 10)) return [3 /*break*/, 5];
                    photo = new Photo_1.Photo();
                    photo.name = "Me and Bears " + i;
                    photo.description = "I am near bears " + i;
                    photo.filename = "photo-with-bears-" + i + ".jpg";
                    photo.views = 10;
                    photo.isPublished = false;
                    photo.categories = categories;
                    photos.push(photo);
                    return [4 /*yield*/, connection.manager.save(photo)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, connection.getRepository(Photo_1.Photo).findOne({
                        select: ["name"],
                        where: {
                            id: 5
                        }
                    })];
                case 6:
                    loadedPhoto = _a.sent();
                    return [4 /*yield*/, connection.getRepository(Photo_1.Photo).find({
                            select: ["filename", "views"],
                        })];
                case 7:
                    loadedPhotos1 = _a.sent();
                    return [4 /*yield*/, connection.getRepository(Photo_1.Photo).find({
                            select: ["id", "name", "description"],
                            relations: ["categories"],
                        })];
                case 8:
                    loadedPhotos2 = _a.sent();
                    // const loadedPhotos3 = await connection.getRepository(Photo).createQueryBuilder("photo")
                    //     .select(["photo.name", "photo.description"])
                    //     .addSelect(["category.name"])
                    //     .leftJoin("photo.categories", "category")
                    //     .getMany();
                    chai_1.expect(loadedPhoto).to.be.eql({
                        name: "Me and Bears 5"
                    });
                    chai_1.expect(loadedPhotos1).to.have.deep.members(photos.map(function (photo) { return ({
                        filename: photo.filename,
                        views: photo.views,
                    }); }));
                    chai_1.expect(loadedPhotos2).to.have.deep.members(photos.map(function (photo) { return ({
                        id: photo.id,
                        name: photo.name,
                        description: photo.description,
                        categories: categories,
                    }); }));
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should select by given conditions", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, category3, loadedCategories1, loadedCategories2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "Bears";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "Dogs";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    category3 = new Category_1.Category();
                    category3.name = "Cats";
                    return [4 /*yield*/, connection.manager.save(category3)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Category_1.Category).find({
                            where: {
                                name: "Bears"
                            }
                        })];
                case 4:
                    loadedCategories1 = _a.sent();
                    chai_1.expect(loadedCategories1).to.be.eql([{
                            id: 1,
                            name: "Bears"
                        }]);
                    return [4 /*yield*/, connection.getRepository(Category_1.Category).find({
                            where: [{
                                    name: "Bears"
                                }, {
                                    name: "Cats"
                                }]
                        })];
                case 5:
                    loadedCategories2 = _a.sent();
                    chai_1.expect(loadedCategories2).to.be.eql([{
                            id: 1,
                            name: "Bears"
                        }, {
                            id: 3,
                            name: "Cats"
                        }]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
describe("repository > find options > cache", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        cache: true
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("repository should cache results properly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2, user3, users1, user4, users2, users3, users4;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User();
                    user1.name = "Harry";
                    return [4 /*yield*/, connection.manager.save(user1)];
                case 1:
                    _a.sent();
                    user2 = new User_1.User();
                    user2.name = "Ron";
                    return [4 /*yield*/, connection.manager.save(user2)];
                case 2:
                    _a.sent();
                    user3 = new User_1.User();
                    user3.name = "Hermione";
                    return [4 /*yield*/, connection.manager.save(user3)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(User_1.User)
                            .find({ cache: true })];
                case 4:
                    users1 = _a.sent();
                    chai_1.expect(users1.length).to.be.equal(3);
                    user4 = new User_1.User();
                    user4.name = "Ginny";
                    return [4 /*yield*/, connection.manager.save(user4)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(User_1.User).find()];
                case 6:
                    users2 = _a.sent();
                    chai_1.expect(users2.length).to.be.equal(4);
                    return [4 /*yield*/, connection.getRepository(User_1.User)
                            .find({ cache: true })];
                case 7:
                    users3 = _a.sent();
                    chai_1.expect(users3.length).to.be.equal(3);
                    // give some time for cache to expire
                    return [4 /*yield*/, test_utils_1.sleep(1000)];
                case 8:
                    // give some time for cache to expire
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(User_1.User)
                            .find({ cache: true })];
                case 9:
                    users4 = _a.sent();
                    chai_1.expect(users4.length).to.be.equal(4);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=repository-find-options.js.map