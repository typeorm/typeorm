"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
/**
 * Because lazy relations are overriding prototype is impossible to run these tests on multiple connections.
 * So we run tests only for mysql.
 */
describe("named-tables-and-columns-lazy-relations", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [
                            Post_1.Post,
                            Category_1.Category,
                        ],
                        enabledDrivers: ["postgres"] // we can properly test lazy-relations only on one platform
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should persist and hydrate successfully on a relation without inverse side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, savedCategory1, savedCategory2, savedCategory3, savedPost, post, categories;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    savedCategory1 = new Category_1.Category();
                    savedCategory1.name = "kids";
                    savedCategory2 = new Category_1.Category();
                    savedCategory2.name = "people";
                    savedCategory3 = new Category_1.Category();
                    savedCategory3.name = "animals";
                    return [4 /*yield*/, categoryRepository.save(savedCategory1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.save(savedCategory2)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.save(savedCategory3)];
                case 3:
                    _a.sent();
                    savedPost = new Post_1.Post();
                    savedPost.title = "Hello post";
                    savedPost.text = "This is post about post";
                    savedPost.categories = Promise.resolve([
                        savedCategory1, savedCategory2, savedCategory3
                    ]);
                    return [4 /*yield*/, postRepository.save(savedPost)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, savedPost.categories.should.eventually.be.eql([savedCategory1, savedCategory2, savedCategory3])];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1)];
                case 6:
                    post = (_a.sent());
                    post.title.should.be.equal("Hello post");
                    post.text.should.be.equal("This is post about post");
                    return [4 /*yield*/, post.categories];
                case 7:
                    categories = _a.sent();
                    categories.length.should.be.equal(3);
                    categories.should.deep.include(savedCategory1);
                    categories.should.deep.include(savedCategory2);
                    categories.should.deep.include(savedCategory3);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should persist and hydrate successfully on a relation with inverse side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, savedCategory1, savedCategory2, savedCategory3, savedPost, post, categories, category, twoSidePosts, likePost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    savedCategory1 = new Category_1.Category();
                    savedCategory1.name = "kids";
                    savedCategory2 = new Category_1.Category();
                    savedCategory2.name = "people";
                    savedCategory3 = new Category_1.Category();
                    savedCategory3.name = "animals";
                    return [4 /*yield*/, categoryRepository.save(savedCategory1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.save(savedCategory2)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.save(savedCategory3)];
                case 3:
                    _a.sent();
                    savedPost = new Post_1.Post();
                    savedPost.title = "Hello post";
                    savedPost.text = "This is post about post";
                    savedPost.twoSideCategories = Promise.resolve([
                        savedCategory1, savedCategory2, savedCategory3
                    ]);
                    return [4 /*yield*/, postRepository.save(savedPost)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, savedPost.twoSideCategories.should.eventually.be.eql([savedCategory1, savedCategory2, savedCategory3])];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1)];
                case 6:
                    post = (_a.sent());
                    post.title.should.be.equal("Hello post");
                    post.text.should.be.equal("This is post about post");
                    return [4 /*yield*/, post.twoSideCategories];
                case 7:
                    categories = _a.sent();
                    categories.length.should.be.equal(3);
                    categories.should.deep.include(savedCategory1);
                    categories.should.deep.include(savedCategory2);
                    categories.should.deep.include(savedCategory3);
                    return [4 /*yield*/, categoryRepository.findOne(1)];
                case 8:
                    category = (_a.sent());
                    category.name.should.be.equal("kids");
                    return [4 /*yield*/, category.twoSidePosts];
                case 9:
                    twoSidePosts = _a.sent();
                    likePost = new Post_1.Post();
                    likePost.id = 1;
                    likePost.title = "Hello post";
                    likePost.text = "This is post about post";
                    twoSidePosts.should.deep.include(likePost);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should persist and hydrate successfully on a many-to-one relation without inverse side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var fakePosts, i, fakePost, fakeCategories, i, fakeCategory, category, post, loadedPost, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fakePosts = [];
                    for (i = 0; i < 30; i++) {
                        fakePost = new Post_1.Post();
                        fakePost.title = "post #" + i;
                        fakePost.text = "post #" + i;
                        fakePosts.push(fakePost);
                    }
                    return [4 /*yield*/, connection.manager.save(fakePosts)];
                case 1:
                    _a.sent();
                    fakeCategories = [];
                    for (i = 0; i < 8; i++) {
                        fakeCategory = new Category_1.Category();
                        fakeCategory.name = "category #" + i;
                        fakeCategories.push(fakeCategory);
                    }
                    return [4 /*yield*/, connection.manager.save(fakeCategories)];
                case 2:
                    _a.sent();
                    category = new Category_1.Category();
                    category.name = "category of great post";
                    post = new Post_1.Post();
                    post.title = "post with great category";
                    post.text = "post with great category and great text";
                    post.category = Promise.resolve(category);
                    return [4 /*yield*/, connection.manager.save(category)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(post)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { where: { title: "post with great category" } })];
                case 5:
                    loadedPost = _a.sent();
                    return [4 /*yield*/, loadedPost.category];
                case 6:
                    loadedCategory = _a.sent();
                    loadedCategory.name.should.be.equal("category of great post");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should persist and hydrate successfully on a many-to-one relation with inverse side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var fakePosts, i, fakePost, fakeCategories, i, fakeCategory, category, post, loadedPost, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fakePosts = [];
                    for (i = 0; i < 8; i++) {
                        fakePost = new Post_1.Post();
                        fakePost.title = "post #" + i;
                        fakePost.text = "post #" + i;
                        fakePosts.push(fakePost);
                    }
                    return [4 /*yield*/, connection.manager.save(fakePosts)];
                case 1:
                    _a.sent();
                    fakeCategories = [];
                    for (i = 0; i < 30; i++) {
                        fakeCategory = new Category_1.Category();
                        fakeCategory.name = "category #" + i;
                        fakeCategories.push(fakeCategory);
                    }
                    return [4 /*yield*/, connection.manager.save(fakeCategories)];
                case 2:
                    _a.sent();
                    category = new Category_1.Category();
                    category.name = "category of great post";
                    post = new Post_1.Post();
                    post.title = "post with great category";
                    post.text = "post with great category and great text";
                    post.twoSideCategory = Promise.resolve(category);
                    return [4 /*yield*/, connection.manager.save(category)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(post)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { where: { title: "post with great category" } })];
                case 5:
                    loadedPost = _a.sent();
                    return [4 /*yield*/, loadedPost.twoSideCategory];
                case 6:
                    loadedCategory = _a.sent();
                    loadedCategory.name.should.be.equal("category of great post");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should persist and hydrate successfully on a one-to-many relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var fakePosts, i, fakePost, fakeCategories, i, fakeCategory, category, post, loadedCategory, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fakePosts = [];
                    for (i = 0; i < 8; i++) {
                        fakePost = new Post_1.Post();
                        fakePost.title = "post #" + i;
                        fakePost.text = "post #" + i;
                        fakePosts.push(fakePost);
                    }
                    return [4 /*yield*/, connection.manager.save(fakePosts)];
                case 1:
                    _a.sent();
                    fakeCategories = [];
                    for (i = 0; i < 30; i++) {
                        fakeCategory = new Category_1.Category();
                        fakeCategory.name = "category #" + i;
                        fakeCategories.push(fakeCategory);
                    }
                    return [4 /*yield*/, connection.manager.save(fakeCategories)];
                case 2:
                    _a.sent();
                    category = new Category_1.Category();
                    category.name = "category of great post";
                    return [4 /*yield*/, connection.manager.save(category)];
                case 3:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "post with great category";
                    post.text = "post with great category and great text";
                    post.twoSideCategory = Promise.resolve(category);
                    return [4 /*yield*/, connection.manager.save(post)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, { where: { name: "category of great post" } })];
                case 5:
                    loadedCategory = _a.sent();
                    return [4 /*yield*/, loadedCategory.twoSidePosts2];
                case 6:
                    loadedPost = _a.sent();
                    loadedPost[0].title.should.be.equal("post with great category");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should persist and hydrate successfully on a one-to-one relation owner side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var fakePosts, i, fakePost, fakeCategories, i, fakeCategory, category, post, loadedPost, loadedCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fakePosts = [];
                    for (i = 0; i < 8; i++) {
                        fakePost = new Post_1.Post();
                        fakePost.title = "post #" + i;
                        fakePost.text = "post #" + i;
                        fakePosts.push(fakePost);
                    }
                    return [4 /*yield*/, connection.manager.save(fakePosts)];
                case 1:
                    _a.sent();
                    fakeCategories = [];
                    for (i = 0; i < 30; i++) {
                        fakeCategory = new Category_1.Category();
                        fakeCategory.name = "category #" + i;
                        fakeCategories.push(fakeCategory);
                    }
                    return [4 /*yield*/, connection.manager.save(fakeCategories)];
                case 2:
                    _a.sent();
                    category = new Category_1.Category();
                    category.name = "category of great post";
                    return [4 /*yield*/, connection.manager.save(category)];
                case 3:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "post with great category";
                    post.text = "post with great category and great text";
                    post.oneCategory = Promise.resolve(category);
                    return [4 /*yield*/, connection.manager.save(post)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { where: { title: "post with great category" } })];
                case 5:
                    loadedPost = _a.sent();
                    return [4 /*yield*/, loadedPost.oneCategory];
                case 6:
                    loadedCategory = _a.sent();
                    loadedCategory.name.should.be.equal("category of great post");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should persist and hydrate successfully on a one-to-one relation inverse side", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var fakePosts, i, fakePost, fakeCategories, i, fakeCategory, category, post, loadedCategory, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fakePosts = [];
                    for (i = 0; i < 8; i++) {
                        fakePost = new Post_1.Post();
                        fakePost.title = "post #" + i;
                        fakePost.text = "post #" + i;
                        fakePosts.push(fakePost);
                    }
                    return [4 /*yield*/, connection.manager.save(fakePosts)];
                case 1:
                    _a.sent();
                    fakeCategories = [];
                    for (i = 0; i < 30; i++) {
                        fakeCategory = new Category_1.Category();
                        fakeCategory.name = "category #" + i;
                        fakeCategories.push(fakeCategory);
                    }
                    return [4 /*yield*/, connection.manager.save(fakeCategories)];
                case 2:
                    _a.sent();
                    category = new Category_1.Category();
                    category.name = "category of great post";
                    return [4 /*yield*/, connection.manager.save(category)];
                case 3:
                    _a.sent();
                    post = new Post_1.Post();
                    post.title = "post with great category";
                    post.text = "post with great category and great text";
                    post.oneCategory = Promise.resolve(category);
                    return [4 /*yield*/, connection.manager.save(post)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, { where: { name: "category of great post" } })];
                case 5:
                    loadedCategory = _a.sent();
                    return [4 /*yield*/, loadedCategory.onePost];
                case 6:
                    loadedPost = _a.sent();
                    loadedPost.title.should.be.equal("post with great category");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=named-tables-and-columns-lazy-relations.js.map