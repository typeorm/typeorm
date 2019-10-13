"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var chai_1 = require("chai");
require("reflect-metadata");
var CockroachDriver_1 = require("../../../../src/driver/cockroachdb/CockroachDriver");
var Album_1 = require("./entity/Album");
var Category_1 = require("./entity/Category");
var test_utils_1 = require("../../../utils/test-utils");
var Photo_1 = require("./entity/Photo");
var PhotoAlbumCategory_1 = require("./entity/PhotoAlbumCategory");
var Post_1 = require("./entity/Post");
var PostCategory_1 = require("./entity/PostCategory");
describe("view entity > general", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should create entity view from query builder definition", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, postCategory, photoAlbumCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getView("post_category")];
                case 1:
                    postCategory = _a.sent();
                    return [4 /*yield*/, queryRunner.getView("photo_album_category")];
                case 2:
                    photoAlbumCategory = _a.sent();
                    chai_1.expect(postCategory).to.be.exist;
                    chai_1.expect(photoAlbumCategory).to.be.exist;
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should correctly return data from View", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var category1, category2, post1, post2, album1, album2, photo1, photo2, photo3, postCategories, postId1, postId2, photoAlbumCategories, photoId1, photoId2, photoAlbumCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    category1 = new Category_1.Category();
                    category1.name = "Cars";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 1:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.name = "Airplanes";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 2:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.name = "About BMW";
                    post1.categoryId = category1.id;
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 3:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.name = "About Boeing";
                    post2.categoryId = category2.id;
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 4:
                    _a.sent();
                    album1 = new Album_1.Album();
                    album1.name = "BMW photos";
                    album1.categoryId = category1.id;
                    return [4 /*yield*/, connection.manager.save(album1)];
                case 5:
                    _a.sent();
                    album2 = new Album_1.Album();
                    album2.name = "Boeing photos";
                    album2.categoryId = category2.id;
                    return [4 /*yield*/, connection.manager.save(album2)];
                case 6:
                    _a.sent();
                    photo1 = new Photo_1.Photo();
                    photo1.name = "BMW E39";
                    photo1.albumId = album1.id;
                    return [4 /*yield*/, connection.manager.save(photo1)];
                case 7:
                    _a.sent();
                    photo2 = new Photo_1.Photo();
                    photo2.name = "BMW E60";
                    photo2.albumId = album1.id;
                    return [4 /*yield*/, connection.manager.save(photo2)];
                case 8:
                    _a.sent();
                    photo3 = new Photo_1.Photo();
                    photo3.name = "Boeing 737";
                    photo3.albumId = album2.id;
                    return [4 /*yield*/, connection.manager.save(photo3)];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(PostCategory_1.PostCategory)];
                case 10:
                    postCategories = _a.sent();
                    postCategories.length.should.be.equal(2);
                    postId1 = connection.driver instanceof CockroachDriver_1.CockroachDriver ? "1" : 1;
                    postCategories[0].id.should.be.equal(postId1);
                    postCategories[0].name.should.be.equal("About BMW");
                    postCategories[0].categoryName.should.be.equal("Cars");
                    postId2 = connection.driver instanceof CockroachDriver_1.CockroachDriver ? "2" : 2;
                    postCategories[1].id.should.be.equal(postId2);
                    postCategories[1].name.should.be.equal("About Boeing");
                    postCategories[1].categoryName.should.be.equal("Airplanes");
                    return [4 /*yield*/, connection.manager.find(PhotoAlbumCategory_1.PhotoAlbumCategory)];
                case 11:
                    photoAlbumCategories = _a.sent();
                    photoAlbumCategories.length.should.be.equal(2);
                    photoId1 = connection.driver instanceof CockroachDriver_1.CockroachDriver ? "1" : 1;
                    photoAlbumCategories[0].id.should.be.equal(photoId1);
                    photoAlbumCategories[0].name.should.be.equal("BMW E39");
                    photoAlbumCategories[0].albumName.should.be.equal("BMW photos");
                    photoAlbumCategories[0].categoryName.should.be.equal("Cars");
                    photoId2 = connection.driver instanceof CockroachDriver_1.CockroachDriver ? "2" : 2;
                    photoAlbumCategories[1].id.should.be.equal(photoId2);
                    photoAlbumCategories[1].name.should.be.equal("BMW E60");
                    photoAlbumCategories[1].albumName.should.be.equal("BMW photos");
                    photoAlbumCategories[1].categoryName.should.be.equal("Cars");
                    return [4 /*yield*/, connection.manager.findOne(PhotoAlbumCategory_1.PhotoAlbumCategory, { id: 1 })];
                case 12:
                    photoAlbumCategory = _a.sent();
                    photoAlbumCategory.id.should.be.equal(photoId1);
                    photoAlbumCategory.name.should.be.equal("BMW E39");
                    photoAlbumCategory.albumName.should.be.equal("BMW photos");
                    photoAlbumCategory.categoryName.should.be.equal("Cars");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=view-entity-general.js.map