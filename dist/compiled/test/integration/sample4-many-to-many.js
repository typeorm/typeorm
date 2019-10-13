"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var index_1 = require("../../src/index");
var PostDetails_1 = require("../../sample/sample4-many-to-many/entity/PostDetails");
var Post_1 = require("../../sample/sample4-many-to-many/entity/Post");
var PostCategory_1 = require("../../sample/sample4-many-to-many/entity/PostCategory");
var PostMetadata_1 = require("../../sample/sample4-many-to-many/entity/PostMetadata");
var PostImage_1 = require("../../sample/sample4-many-to-many/entity/PostImage");
var test_utils_1 = require("../utils/test-utils");
describe("many-to-many", function () {
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
                            entities: [__dirname + "/../../sample/sample4-many-to-many/entity/*"],
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
            newPost.details = [];
            newPost.details.push(details);
            return postRepository.save(newPost).then(function (post) { return savedPost = post; });
        });
        it("should return the same post instance after its created", function () {
            savedPost.should.be.equal(newPost);
        });
        it("should return the same post details instance after its created", function () {
            savedPost.details[0].should.be.equal(newPost.details[0]);
        });
        it("should have a new generated id after post is created", function () {
            chai_1.expect(savedPost.id).not.to.be.undefined;
            chai_1.expect(savedPost.details[0].id).not.to.be.undefined;
        });
        it("should have inserted post in the database", function () {
            var expectedPost = new Post_1.Post();
            expectedPost.id = savedPost.id;
            expectedPost.text = savedPost.text;
            expectedPost.title = savedPost.title;
            return postRepository.findOne(savedPost.id).should.eventually.eql(expectedPost);
        });
        it("should have inserted post details in the database", function () {
            var expectedDetails = new PostDetails_1.PostDetails();
            expectedDetails.id = savedPost.details[0].id;
            expectedDetails.authorName = savedPost.details[0].authorName;
            expectedDetails.comment = savedPost.details[0].comment;
            expectedDetails.metadata = savedPost.details[0].metadata;
            return postDetailsRepository.findOne(savedPost.details[0].id).should.eventually.eql(expectedDetails);
        });
        it("should load post and its details if left join used", function () {
            var expectedPost = new Post_1.Post();
            expectedPost.id = savedPost.id;
            expectedPost.text = savedPost.text;
            expectedPost.title = savedPost.title;
            expectedPost.details = [];
            expectedPost.details.push(new PostDetails_1.PostDetails());
            expectedPost.details[0].id = savedPost.details[0].id;
            expectedPost.details[0].authorName = savedPost.details[0].authorName;
            expectedPost.details[0].comment = savedPost.details[0].comment;
            expectedPost.details[0].metadata = savedPost.details[0].metadata;
            return postRepository
                .createQueryBuilder("post")
                .leftJoinAndSelect("post.details", "details")
                .where("post.id=:id")
                .setParameter("id", savedPost.id)
                .getOne()
                .should.eventually.eql(expectedPost);
        });
        it("should load details and its post if left join used (from reverse side)", function () {
            var expectedDetails = new PostDetails_1.PostDetails();
            expectedDetails.id = savedPost.details[0].id;
            expectedDetails.authorName = savedPost.details[0].authorName;
            expectedDetails.comment = savedPost.details[0].comment;
            expectedDetails.metadata = savedPost.details[0].metadata;
            var expectedPost = new Post_1.Post();
            expectedPost.id = savedPost.id;
            expectedPost.text = savedPost.text;
            expectedPost.title = savedPost.title;
            expectedDetails.posts = [];
            expectedDetails.posts.push(expectedPost);
            return postDetailsRepository
                .createQueryBuilder("details")
                .leftJoinAndSelect("details.posts", "posts")
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
            expectedDetails.id = savedPost.details[0].id;
            expectedDetails.authorName = savedPost.details[0].authorName;
            expectedDetails.comment = savedPost.details[0].comment;
            expectedDetails.metadata = savedPost.details[0].metadata;
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
            newPost.categories = [];
            newPost.categories.push(category);
            return postRepository.save(newPost).then(function (post) { return savedPost = post; });
        });
        it("should return the same post instance after its created", function () {
            savedPost.should.be.equal(newPost);
        });
        it("should return the same post category instance after its created", function () {
            savedPost.categories.should.be.equal(newPost.categories);
        });
        it("should have a new generated id after post is created", function () {
            chai_1.expect(savedPost.id).not.to.be.undefined;
            chai_1.expect(savedPost.categories[0].id).not.to.be.undefined;
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
            expectedPost.id = savedPost.categories[0].id;
            expectedPost.name = "technology";
            return postCategoryRepository.findOne(savedPost.categories[0].id).should.eventually.eql(expectedPost);
        });
        it("should load post and its category if left join used", function () {
            var expectedPost = new Post_1.Post();
            expectedPost.id = savedPost.id;
            expectedPost.title = savedPost.title;
            expectedPost.text = savedPost.text;
            expectedPost.categories = [];
            expectedPost.categories.push(new PostCategory_1.PostCategory());
            expectedPost.categories[0].id = savedPost.categories[0].id;
            expectedPost.categories[0].name = savedPost.categories[0].name;
            return postRepository
                .createQueryBuilder("post")
                .leftJoinAndSelect("post.categories", "categories")
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
            newPost.details = [];
            newPost.details.push(details);
            return postRepository
                .save(newPost);
        });
        it("should ignore updates in the model and do not update the db when entity is updated", function () {
            newPost.details[0].comment = "i am updated comment";
            return postRepository.save(newPost).then(function (updatedPost) {
                updatedPost.details[0].comment.should.be.equal("i am updated comment");
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.details", "details")
                    .where("post.id=:id")
                    .setParameter("id", updatedPost.id)
                    .getOne();
            }).then(function (updatedPostReloaded) {
                updatedPostReloaded.details[0].comment.should.be.equal("this is post");
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
            newPost.details = [];
            newPost.details.push(details);
            return postRepository
                .save(newPost);
        });
        it("should remove relation however should not remove details itself", function () {
            newPost.details = [];
            return postRepository.save(newPost).then(function (updatedPost) {
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.details", "details")
                    .where("post.id=:id")
                    .setParameter("id", updatedPost.id)
                    .getOne();
            }).then(function (updatedPostReloaded) {
                chai_1.expect(updatedPostReloaded.details).to.be.eql([]);
                return postDetailsRepository
                    .createQueryBuilder("details")
                    .leftJoinAndSelect("details.posts", "posts")
                    .where("details.id=:id")
                    .setParameter("id", details.id)
                    .getOne();
            }).then(function (reloadedDetails) {
                chai_1.expect(reloadedDetails).not.to.be.undefined;
                chai_1.expect(reloadedDetails.posts).to.be.eql([]);
            });
        });
    });
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
                newPost.images = [];
                newPost.images.push(image);
                return postRepository.save(newPost);
            }).then(function (post) {
                newPost = post;
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.images", "images")
                    .where("post.id=:id")
                    .setParameter("id", post.id)
                    .getOne();
            }).then(function (loadedPost) {
                loadedPost.images[0].url = "new-logo.png";
                return postRepository.save(loadedPost);
            }).then(function () {
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.images", "images")
                    .where("post.id=:id")
                    .setParameter("id", newPost.id)
                    .getOne();
            }).then(function (reloadedPost) {
                reloadedPost.images[0].url.should.be.equal("new-logo.png");
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
                newPost.metadatas = [];
                newPost.metadatas.push(metadata);
                return postRepository.save(newPost);
            }).then(function (post) {
                newPost = post;
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.metadatas", "metadatas")
                    .where("post.id=:id")
                    .setParameter("id", post.id)
                    .getOne();
            }).then(function (loadedPost) {
                loadedPost.metadatas = [];
                return postRepository.save(loadedPost);
            }).then(function () {
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.metadatas", "metadatas")
                    .where("post.id=:id")
                    .setParameter("id", newPost.id)
                    .getOne();
            }).then(function (reloadedPost) {
                chai_1.expect(reloadedPost.metadatas).to.be.eql([]);
            });
        });
    });
    describe("insert post details from reverse side", function () {
        if (!connection)
            return;
        var newPost, details, savedDetails;
        before(reloadDatabase);
        before(function () {
            newPost = new Post_1.Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";
            details = new PostDetails_1.PostDetails();
            details.comment = "post details comment";
            details.posts = [];
            details.posts.push(newPost);
            return postDetailsRepository.save(details).then(function (details) { return savedDetails = details; });
        });
        it("should return the same post instance after its created", function () {
            savedDetails.posts[0].should.be.equal(newPost);
        });
        it("should return the same post details instance after its created", function () {
            savedDetails.should.be.equal(details);
        });
        it("should have a new generated id after post is created", function () {
            chai_1.expect(savedDetails.id).not.to.be.undefined;
            chai_1.expect(details.id).not.to.be.undefined;
        });
        it("should have inserted post in the database", function () {
            var expectedPost = new Post_1.Post();
            expectedPost.id = newPost.id;
            expectedPost.text = newPost.text;
            expectedPost.title = newPost.title;
            return postRepository.findOne(savedDetails.id).should.eventually.eql(expectedPost);
        });
        it("should have inserted details in the database", function () {
            var expectedDetails = new PostDetails_1.PostDetails();
            expectedDetails.id = details.id;
            expectedDetails.comment = details.comment;
            expectedDetails.metadata = null;
            expectedDetails.authorName = null;
            return postDetailsRepository.findOne(details.id).should.eventually.eql(expectedDetails);
        });
        it("should load post and its details if left join used", function () {
            var expectedDetails = new PostDetails_1.PostDetails();
            expectedDetails.id = savedDetails.id;
            expectedDetails.comment = savedDetails.comment;
            expectedDetails.metadata = null;
            expectedDetails.authorName = null;
            expectedDetails.posts = [];
            expectedDetails.posts.push(new Post_1.Post());
            expectedDetails.posts[0].id = newPost.id;
            expectedDetails.posts[0].text = newPost.text;
            expectedDetails.posts[0].title = newPost.title;
            return postDetailsRepository
                .createQueryBuilder("details")
                .leftJoinAndSelect("details.posts", "posts")
                .where("details.id=:id", { id: savedDetails.id })
                .getOne()
                .should.eventually.eql(expectedDetails);
        });
    });
});
//# sourceMappingURL=sample4-many-to-many.js.map