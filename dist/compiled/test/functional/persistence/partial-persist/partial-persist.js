"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var chai_1 = require("chai");
var Counters_1 = require("./entity/Counters");
describe("persistence > partial persist", function () {
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
    // Specifications
    // -------------------------------------------------------------------------
    it("should persist partial entities without data loss", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, categoryRepository, newCategory, newPost, loadedPost, loadedPostAfterTitleUpdate, loadedPostAfterStarsUpdate, loadedPostAfterCategoryUpdate;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    categoryRepository = connection.getRepository(Category_1.Category);
                    newCategory = new Category_1.Category();
                    newCategory.id = 1;
                    newCategory.name = "Animals";
                    newCategory.position = 999;
                    return [4 /*yield*/, categoryRepository.save(newCategory)];
                case 1:
                    _a.sent();
                    newPost = new Post_1.Post();
                    newPost.id = 1;
                    newPost.title = "All about animals";
                    newPost.description = "Description of the post about animals";
                    newPost.categories = [newCategory];
                    newPost.counters = new Counters_1.Counters();
                    newPost.counters.stars = 5;
                    newPost.counters.commentCount = 2;
                    newPost.counters.metadata = "Animals Metadata";
                    return [4 /*yield*/, postRepository.save(newPost)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(newPost.id, {
                            join: {
                                alias: "post",
                                leftJoinAndSelect: {
                                    categories: "post.categories"
                                }
                            }
                        })];
                case 3:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    chai_1.expect(loadedPost.categories).not.to.be.undefined;
                    loadedPost.title.should.be.equal("All about animals");
                    loadedPost.description.should.be.equal("Description of the post about animals");
                    loadedPost.categories[0].name.should.be.equal("Animals");
                    loadedPost.categories[0].position.should.be.equal(999);
                    loadedPost.counters.metadata.should.be.equal("Animals Metadata");
                    loadedPost.counters.stars.should.be.equal(5);
                    loadedPost.counters.commentCount.should.be.equal(2);
                    // now update partially
                    return [4 /*yield*/, postRepository.update({ title: "All about animals" }, { title: "All about bears" })];
                case 4:
                    // now update partially
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1, {
                            join: {
                                alias: "post",
                                leftJoinAndSelect: {
                                    categories: "post.categories"
                                }
                            }
                        })];
                case 5:
                    loadedPostAfterTitleUpdate = _a.sent();
                    chai_1.expect(loadedPostAfterTitleUpdate).not.to.be.undefined;
                    chai_1.expect(loadedPostAfterTitleUpdate.categories).not.to.be.undefined;
                    loadedPostAfterTitleUpdate.title.should.be.equal("All about bears");
                    loadedPostAfterTitleUpdate.description.should.be.equal("Description of the post about animals");
                    loadedPostAfterTitleUpdate.categories[0].name.should.be.equal("Animals");
                    loadedPostAfterTitleUpdate.categories[0].position.should.be.equal(999);
                    loadedPostAfterTitleUpdate.counters.metadata.should.be.equal("Animals Metadata");
                    loadedPostAfterTitleUpdate.counters.stars.should.be.equal(5);
                    loadedPostAfterTitleUpdate.counters.commentCount.should.be.equal(2);
                    // now update in partial embeddable column
                    return [4 /*yield*/, postRepository.update({ id: 1 }, { counters: { stars: 10 } })];
                case 6:
                    // now update in partial embeddable column
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1, {
                            join: {
                                alias: "post",
                                leftJoinAndSelect: {
                                    categories: "post.categories"
                                }
                            }
                        })];
                case 7:
                    loadedPostAfterStarsUpdate = _a.sent();
                    chai_1.expect(loadedPostAfterStarsUpdate).not.to.be.undefined;
                    chai_1.expect(loadedPostAfterStarsUpdate.categories).not.to.be.undefined;
                    loadedPostAfterStarsUpdate.title.should.be.equal("All about bears");
                    loadedPostAfterStarsUpdate.description.should.be.equal("Description of the post about animals");
                    loadedPostAfterStarsUpdate.categories[0].name.should.be.equal("Animals");
                    loadedPostAfterStarsUpdate.categories[0].position.should.be.equal(999);
                    loadedPostAfterStarsUpdate.counters.metadata.should.be.equal("Animals Metadata");
                    loadedPostAfterStarsUpdate.counters.stars.should.be.equal(10);
                    loadedPostAfterStarsUpdate.counters.commentCount.should.be.equal(2);
                    // now update in relational column
                    return [4 /*yield*/, postRepository.save({ id: 1, categories: [{ id: 1, name: "Bears" }] })];
                case 8:
                    // now update in relational column
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1, {
                            join: {
                                alias: "post",
                                leftJoinAndSelect: {
                                    categories: "post.categories"
                                }
                            }
                        })];
                case 9:
                    loadedPostAfterCategoryUpdate = _a.sent();
                    chai_1.expect(loadedPostAfterCategoryUpdate).not.to.be.undefined;
                    chai_1.expect(loadedPostAfterCategoryUpdate.categories).not.to.be.undefined;
                    loadedPostAfterCategoryUpdate.title.should.be.equal("All about bears");
                    loadedPostAfterCategoryUpdate.description.should.be.equal("Description of the post about animals");
                    loadedPostAfterCategoryUpdate.categories[0].name.should.be.equal("Bears");
                    loadedPostAfterCategoryUpdate.categories[0].position.should.be.equal(999);
                    loadedPostAfterCategoryUpdate.counters.metadata.should.be.equal("Animals Metadata");
                    loadedPostAfterCategoryUpdate.counters.stars.should.be.equal(10);
                    loadedPostAfterCategoryUpdate.counters.commentCount.should.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=partial-persist.js.map