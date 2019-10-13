"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var index_1 = require("../../src/index");
var PostDetails_1 = require("../../sample/sample2-one-to-one/entity/PostDetails");
var Post_1 = require("../../sample/sample2-one-to-one/entity/Post");
var PostCategory_1 = require("../../sample/sample2-one-to-one/entity/PostCategory");
var PostAuthor_1 = require("../../sample/sample2-one-to-one/entity/PostAuthor");
var PostMetadata_1 = require("../../sample/sample2-one-to-one/entity/PostMetadata");
var PostImage_1 = require("../../sample/sample2-one-to-one/entity/PostImage");
var PostInformation_1 = require("../../sample/sample2-one-to-one/entity/PostInformation");
var test_utils_1 = require("../utils/test-utils");
describe("one-to-one", function () {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    // connect to db
    var connection;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var options;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = test_utils_1.setupSingleTestingConnection("mysql", {
                            entities: [Post_1.Post, PostDetails_1.PostDetails, PostCategory_1.PostCategory, PostMetadata_1.PostMetadata, PostImage_1.PostImage, PostInformation_1.PostInformation, PostAuthor_1.PostAuthor],
                        });
                        if (!options)
                            return [2 /*return*/];
                        return [4 /*yield*/, index_1.createConnection(options)];
                    case 1:
                        connection = _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    });
    after(function () { return connection.close(); });
    // clean up database before each test
    function reloadDatabase() {
        if (!connection)
            return;
        return connection.synchronize(true);
    }
    var postRepository, postDetailsRepository, postCategoryRepository, postImageRepository, postMetadataRepository;
    before(function () {
        if (!connection)
            return;
        postRepository = connection.getRepository(Post_1.Post);
        postDetailsRepository = connection.getRepository(PostDetails_1.PostDetails);
        postCategoryRepository = connection.getRepository(PostCategory_1.PostCategory);
        postImageRepository = connection.getRepository(PostImage_1.PostImage);
        postMetadataRepository = connection.getRepository(PostMetadata_1.PostMetadata);
    });
    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    describe("insert post and details (has inverse relation + full cascade options)", function () {
        if (!connection)
            return;
        var newPost, details, savedPost;
        before(reloadDatabase);
        before(function () {
            details = new PostDetails_1.PostDetails();
            details.authorName = "Umed";
            details.comment = "this is post";
            details.metadata = "post,posting,postman";
            newPost = new Post_1.Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";
            newPost.details = details;
            return postRepository.save(newPost).then(function (post) { return savedPost = post; });
        });
        it("should return the same post instance after its created", function () {
            savedPost.should.be.equal(newPost);
        });
        it("should return the same post details instance after its created", function () {
            savedPost.details.should.be.equal(newPost.details);
        });
        it("should have a new generated id after post is created", function () {
            chai_1.expect(savedPost.id).not.to.be.undefined;
            chai_1.expect(savedPost.details.id).not.to.be.undefined;
        });
        it("should have inserted post in the database", function () {
            if (!connection)
                return;
            var expectedPost = new Post_1.Post();
            expectedPost.id = savedPost.id;
            expectedPost.text = savedPost.text;
            expectedPost.title = savedPost.title;
            return postRepository.findOne(savedPost.id).should.eventually.eql(expectedPost);
        });
        it("should have inserted post details in the database", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var expectedDetails, loadedPostDetails;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!connection)
                                return [2 /*return*/];
                            expectedDetails = new PostDetails_1.PostDetails();
                            expectedDetails.id = savedPost.details.id;
                            expectedDetails.authorName = savedPost.details.authorName;
                            expectedDetails.comment = savedPost.details.comment;
                            expectedDetails.metadata = savedPost.details.metadata;
                            return [4 /*yield*/, postDetailsRepository.findOne(savedPost.details.id)];
                        case 1:
                            loadedPostDetails = _a.sent();
                            loadedPostDetails.should.be.eql(expectedDetails);
                            return [2 /*return*/];
                    }
                });
            });
        });
        it("should load post and its details if left join used", function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var expectedPost, post;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!connection)
                                return [2 /*return*/];
                            expectedPost = new Post_1.Post();
                            expectedPost.id = savedPost.id;
                            expectedPost.text = savedPost.text;
                            expectedPost.title = savedPost.title;
                            expectedPost.details = new PostDetails_1.PostDetails();
                            expectedPost.details.id = savedPost.details.id;
                            expectedPost.details.authorName = savedPost.details.authorName;
                            expectedPost.details.comment = savedPost.details.comment;
                            expectedPost.details.metadata = savedPost.details.metadata;
                            return [4 /*yield*/, postRepository
                                    .createQueryBuilder("post")
                                    .leftJoinAndSelect("post.details", "details")
                                    .where("post.id=:id")
                                    .setParameter("id", savedPost.id)
                                    .getOne()];
                        case 1:
                            post = _a.sent();
                            chai_1.expect(post).not.to.be.undefined;
                            post.should.eql(expectedPost);
                            return [2 /*return*/];
                    }
                });
            });
        });
        it("should load details and its post if left join used (from reverse side)", function () {
            if (!connection)
                return;
            var expectedDetails = new PostDetails_1.PostDetails();
            expectedDetails.id = savedPost.details.id;
            expectedDetails.authorName = savedPost.details.authorName;
            expectedDetails.comment = savedPost.details.comment;
            expectedDetails.metadata = savedPost.details.metadata;
            expectedDetails.post = new Post_1.Post();
            expectedDetails.post.id = savedPost.id;
            expectedDetails.post.text = savedPost.text;
            expectedDetails.post.title = savedPost.title;
            return postDetailsRepository
                .createQueryBuilder("details")
                .leftJoinAndSelect("details.post", "post")
                .where("details.id=:id")
                .setParameter("id", savedPost.id)
                .getOne()
                .should.eventually.eql(expectedDetails);
        });
        it("should load saved post without details if left joins are not specified", function () {
            var expectedPost = new Post_1.Post();
            expectedPost.id = savedPost.id;
            expectedPost.text = savedPost.text;
            expectedPost.title = savedPost.title;
            return postRepository
                .createQueryBuilder("post")
                .where("post.id=:id", { id: savedPost.id })
                .getOne()
                .should.eventually.eql(expectedPost);
        });
        it("should load saved post without details if left joins are not specified", function () {
            var expectedDetails = new PostDetails_1.PostDetails();
            expectedDetails.id = savedPost.details.id;
            expectedDetails.authorName = savedPost.details.authorName;
            expectedDetails.comment = savedPost.details.comment;
            expectedDetails.metadata = savedPost.details.metadata;
            return postDetailsRepository
                .createQueryBuilder("details")
                .where("details.id=:id", { id: savedPost.id })
                .getOne()
                .should.eventually.eql(expectedDetails);
        });
    });
    describe("insert post and category (one-side relation)", function () {
        if (!connection)
            return;
        var newPost, category, savedPost;
        before(reloadDatabase);
        before(function () {
            category = new PostCategory_1.PostCategory();
            category.name = "technology";
            newPost = new Post_1.Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";
            newPost.category = category;
            return postRepository.save(newPost).then(function (post) { return savedPost = post; });
        });
        it("should return the same post instance after its created", function () {
            savedPost.should.be.equal(newPost);
        });
        it("should return the same post category instance after its created", function () {
            savedPost.category.should.be.equal(newPost.category);
        });
        it("should have a new generated id after post is created", function () {
            chai_1.expect(savedPost.id).not.to.be.undefined;
            chai_1.expect(savedPost.category.id).not.to.be.undefined;
        });
        it("should have inserted post in the database", function () {
            var expectedPost = new Post_1.Post();
            expectedPost.id = savedPost.id;
            expectedPost.text = savedPost.text;
            expectedPost.title = savedPost.title;
            return postRepository.findOne(savedPost.id).should.eventually.eql(expectedPost);
        });
        it("should have inserted category in the database", function () {
            var expectedPost = new PostCategory_1.PostCategory();
            expectedPost.id = savedPost.category.id;
            expectedPost.name = "technology";
            return postCategoryRepository.findOne(savedPost.category.id).should.eventually.eql(expectedPost);
        });
        it("should load post and its category if left join used", function () {
            var expectedPost = new Post_1.Post();
            expectedPost.id = savedPost.id;
            expectedPost.title = savedPost.title;
            expectedPost.text = savedPost.text;
            expectedPost.category = new PostCategory_1.PostCategory();
            expectedPost.category.id = savedPost.category.id;
            expectedPost.category.name = savedPost.category.name;
            return postRepository
                .createQueryBuilder("post")
                .leftJoinAndSelect("post.category", "category")
                .where("post.id=:id", { id: savedPost.id })
                .getOne()
                .should.eventually.eql(expectedPost);
        });
        it("should load details and its post if left join used (from reverse side)", function () {
            // later need to specify with what exception we reject it
            /*return postCategoryRepository
                .createQueryBuilder("category")
                .leftJoinAndSelect("category.post", "post")
                .where("category.id=:id", { id: savedPost.id })
                .getSingleResult()
                .should.be.rejectedWith(Error);*/ // not working, find fix
        });
    });
    describe("cascade updates should not be executed when cascadeUpdate option is not set", function () {
        if (!connection)
            return;
        var newPost, details;
        before(reloadDatabase);
        before(function () {
            details = new PostDetails_1.PostDetails();
            details.authorName = "Umed";
            details.comment = "this is post";
            details.metadata = "post,posting,postman";
            newPost = new Post_1.Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";
            newPost.details = details;
            return postRepository.save(newPost);
        });
        it("should ignore updates in the model and do not update the db when entity is updated", function () {
            newPost.details.comment = "i am updated comment";
            return postRepository.save(newPost).then(function (updatedPost) {
                updatedPost.details.comment.should.be.equal("i am updated comment");
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.details", "details")
                    .where("post.id=:id")
                    .setParameter("id", updatedPost.id)
                    .getOne();
            }).then(function (updatedPostReloaded) {
                updatedPostReloaded.details.comment.should.be.equal("this is post");
            });
        }); // todo: also check that updates throw exception in strict cascades mode
    });
    describe("cascade remove should not be executed when cascadeRemove option is not set", function () {
        if (!connection)
            return;
        var newPost, details;
        before(reloadDatabase);
        before(function () {
            details = new PostDetails_1.PostDetails();
            details.authorName = "Umed";
            details.comment = "this is post";
            details.metadata = "post,posting,postman";
            newPost = new Post_1.Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";
            newPost.details = details;
            return postRepository.save(newPost);
        });
        it("should ignore updates in the model and do not update the db when entity is updated", function () {
            if (!connection)
                return;
            delete newPost.details;
            return postRepository.save(newPost).then(function (updatedPost) {
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.details", "details")
                    .where("post.id=:id")
                    .setParameter("id", updatedPost.id)
                    .getOne();
            }).then(function (updatedPostReloaded) {
                updatedPostReloaded.details.comment.should.be.equal("this is post");
            });
        });
    });
    // todo: check why it generates extra query
    describe("cascade updates should be executed when cascadeUpdate option is set", function () {
        if (!connection)
            return;
        var newPost, newImage;
        before(reloadDatabase);
        it("should update a relation successfully when updated", function () {
            newImage = new PostImage_1.PostImage();
            newImage.url = "logo.png";
            newPost = new Post_1.Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";
            return postImageRepository
                .save(newImage)
                .then(function (image) {
                newPost.image = image;
                return postRepository.save(newPost);
            }).then(function (post) {
                newPost = post;
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.image", "image")
                    .where("post.id=:id")
                    .setParameter("id", post.id)
                    .getOne();
            }).then(function (loadedPost) {
                loadedPost.image.url = "new-logo.png";
                return postRepository.save(loadedPost);
            }).then(function () {
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.image", "image")
                    .where("post.id=:id")
                    .setParameter("id", newPost.id)
                    .getOne();
            }).then(function (reloadedPost) {
                reloadedPost.image.url.should.be.equal("new-logo.png");
            });
        });
    });
    describe("cascade remove should be executed when cascadeRemove option is set", function () {
        if (!connection)
            return;
        var newPost, newMetadata;
        before(reloadDatabase);
        it("should remove a relation entity successfully when removed", function () {
            newMetadata = new PostMetadata_1.PostMetadata();
            newMetadata.description = "this is post metadata";
            newPost = new Post_1.Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";
            return postMetadataRepository
                .save(newMetadata)
                .then(function (metadata) {
                newPost.metadata = metadata;
                return postRepository.save(newPost);
            }).then(function (post) {
                newPost = post;
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.metadata", "metadata")
                    .where("post.id=:id")
                    .setParameter("id", post.id)
                    .getOne();
            }).then(function (loadedPost) {
                loadedPost.metadata = null;
                return postRepository.save(loadedPost);
            }).then(function () {
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.metadata", "metadata")
                    .where("post.id=:id")
                    .setParameter("id", newPost.id)
                    .getOne();
            }).then(function (reloadedPost) {
                chai_1.expect(reloadedPost.metadata).to.not.exist;
            });
        });
    });
});
//# sourceMappingURL=sample2-one-to-one.js.map