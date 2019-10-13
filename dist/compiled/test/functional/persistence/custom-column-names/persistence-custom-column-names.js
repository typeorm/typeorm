"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var chai_1 = require("chai");
require("reflect-metadata");
var src_1 = require("../../../../src");
var test_utils_1 = require("../../../utils/test-utils");
var Category_1 = require("./entity/Category");
var CategoryMetadata_1 = require("./entity/CategoryMetadata");
var Post_1 = require("./entity/Post");
describe("persistence > custom-column-names", function () {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var _this = this;
    // connect to db
    var connection;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var options;
        return tslib_1.__generator(this, function (_a) {
            options = test_utils_1.setupSingleTestingConnection("mysql", {
                entities: [Post_1.Post, Category_1.Category, CategoryMetadata_1.CategoryMetadata]
            });
            if (!options)
                return [2 /*return*/];
            connection = src_1.getConnectionManager().create(options);
            return [2 /*return*/];
        });
    }); });
    after(function () { return connection.close(); });
    // clean up database before each test
    function reloadDatabase() {
        if (!connection)
            return;
        return connection
            .synchronize(true)
            .catch(function (e) {
            console.log("Error during schema re-creation: ", e);
            throw e;
        });
    }
    var postRepository;
    var categoryRepository;
    var metadataRepository;
    before(function () {
        if (!connection)
            return;
        postRepository = connection.getRepository(Post_1.Post);
        categoryRepository = connection.getRepository(Category_1.Category);
        metadataRepository = connection.getRepository(CategoryMetadata_1.CategoryMetadata);
    });
    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    describe("attach exist entity to exist entity with many-to-one relation", function () {
        if (!connection)
            return;
        var newPost, newCategory, loadedPost;
        before(reloadDatabase);
        // save a new category
        before(function () {
            newCategory = categoryRepository.create();
            newCategory.name = "Animals";
            return categoryRepository.save(newCategory);
        });
        // save a new post
        before(function () {
            newPost = postRepository.create();
            newPost.title = "All about animals";
            return postRepository.save(newPost);
        });
        // attach category to post and save it
        before(function () {
            newPost.category = newCategory;
            return postRepository.save(newPost);
        });
        // load a post
        before(function () {
            return postRepository
                .findOne(1, { join: { alias: "post", leftJoinAndSelect: { category: "post.category" } } })
                .then(function (post) { return loadedPost = post; });
        });
        it("should contain attached category", function () {
            chai_1.expect(loadedPost).not.to.be.undefined;
            chai_1.expect(loadedPost.category).not.to.be.undefined;
            chai_1.expect(loadedPost.categoryId).not.to.be.undefined;
        });
    });
    describe("attach new entity to exist entity with many-to-one relation", function () {
        if (!connection)
            return;
        var newPost, newCategory, loadedPost;
        before(reloadDatabase);
        // save a new category
        before(function () {
            newCategory = categoryRepository.create();
            newCategory.name = "Animals";
            return categoryRepository.save(newCategory);
        });
        // save a new post and attach category
        before(function () {
            newPost = postRepository.create();
            newPost.title = "All about animals";
            newPost.category = newCategory;
            return postRepository.save(newPost);
        });
        // load a post
        before(function () {
            return postRepository
                .findOne(1, { join: { alias: "post", leftJoinAndSelect: { category: "post.category" } } })
                .then(function (post) { return loadedPost = post; });
        });
        it("should contain attached category", function () {
            chai_1.expect(loadedPost).not.to.be.undefined;
            chai_1.expect(loadedPost.category).not.to.be.undefined;
            chai_1.expect(loadedPost.categoryId).not.to.be.undefined;
        });
    });
    describe("attach new entity to new entity with many-to-one relation", function () {
        if (!connection)
            return;
        var newPost, newCategory, loadedPost;
        before(reloadDatabase);
        // save a new category, post and attach category to post
        before(function () {
            newCategory = categoryRepository.create();
            newCategory.name = "Animals";
            newPost = postRepository.create();
            newPost.title = "All about animals";
            newPost.category = newCategory;
            return postRepository.save(newPost);
        });
        // load a post
        before(function () {
            return postRepository
                .findOne(1, { join: { alias: "post", leftJoinAndSelect: { category: "post.category" } } })
                .then(function (post) { return loadedPost = post; });
        });
        it("should contain attached category", function () {
            chai_1.expect(loadedPost).not.to.be.undefined;
            chai_1.expect(loadedPost.category).not.to.be.undefined;
            chai_1.expect(loadedPost.categoryId).not.to.be.undefined;
        });
    });
    describe("attach exist entity to exist entity with one-to-one relation", function () {
        if (!connection)
            return;
        var newPost, newCategory, newMetadata, loadedPost;
        before(reloadDatabase);
        // save a new post
        before(function () {
            newPost = postRepository.create();
            newPost.title = "All about animals";
            return postRepository.save(newPost);
        });
        // save a new category
        before(function () {
            newCategory = categoryRepository.create();
            newCategory.name = "Animals";
            return categoryRepository.save(newCategory);
        });
        // save a new metadata
        before(function () {
            newMetadata = metadataRepository.create();
            newMetadata.keyword = "animals";
            return metadataRepository.save(newMetadata);
        });
        // attach metadata to category and category to post and save it
        before(function () {
            newCategory.metadata = newMetadata;
            newPost.category = newCategory;
            return postRepository.save(newPost);
        });
        // load a post
        before(function () {
            return postRepository
                .findOne(1, { join: { alias: "post", leftJoinAndSelect: { category: "post.category", metadata: "category.metadata" } } })
                .then(function (post) { return loadedPost = post; });
        });
        it("should contain attached category and metadata in the category", function () {
            chai_1.expect(loadedPost).not.to.be.undefined;
            chai_1.expect(loadedPost.category).not.to.be.undefined;
            chai_1.expect(loadedPost.categoryId).not.to.be.undefined;
            chai_1.expect(loadedPost.category.metadata).not.to.be.undefined;
            chai_1.expect(loadedPost.category.metadataId).not.to.be.undefined;
        });
    });
    describe("attach new entity to exist entity with one-to-one relation", function () {
        if (!connection)
            return;
        var newPost, newCategory, newMetadata, loadedPost;
        before(reloadDatabase);
        // save a new post
        before(function () {
            newPost = postRepository.create();
            newPost.title = "All about animals";
            return postRepository.save(newPost);
        });
        // save a new category and new metadata
        before(function () {
            newMetadata = metadataRepository.create();
            newMetadata.keyword = "animals";
            newCategory = categoryRepository.create();
            newCategory.name = "Animals";
            newCategory.metadata = newMetadata;
            return categoryRepository.save(newCategory);
        });
        // attach metadata to category and category to post and save it
        before(function () {
            newPost.category = newCategory;
            return postRepository.save(newPost);
        });
        // load a post
        before(function () {
            return postRepository
                .findOne(1, { join: { alias: "post", leftJoinAndSelect: { category: "post.category", metadata: "category.metadata" } } })
                .then(function (post) { return loadedPost = post; });
        });
        it("should contain attached category and metadata in the category", function () {
            chai_1.expect(loadedPost).not.to.be.undefined;
            chai_1.expect(loadedPost.category).not.to.be.undefined;
            chai_1.expect(loadedPost.categoryId).not.to.be.undefined;
            chai_1.expect(loadedPost.category.metadata).not.to.be.undefined;
            chai_1.expect(loadedPost.category.metadataId).not.to.be.undefined;
        });
    });
});
//# sourceMappingURL=persistence-custom-column-names.js.map