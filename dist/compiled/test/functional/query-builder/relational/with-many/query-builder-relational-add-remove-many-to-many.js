"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var Post_1 = require("./entity/Post");
var Image_1 = require("./entity/Image");
var test_utils_1 = require("../../../../utils/test-utils");
var chai_1 = require("chai");
describe("query builder > relational with many > add and remove many to many", function () {
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
    it("should add entity relation of a given entity by entity objects", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var image1, image2, image3, post1, post2, post3, loadedPost1, loadedPost2, loadedPost3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    image1 = new Image_1.Image();
                    image1.url = "image #1";
                    return [4 /*yield*/, connection.manager.save(image1)];
                case 1:
                    _a.sent();
                    image2 = new Image_1.Image();
                    image2.url = "image #2";
                    return [4 /*yield*/, connection.manager.save(image2)];
                case 2:
                    _a.sent();
                    image3 = new Image_1.Image();
                    image3.url = "image #3";
                    return [4 /*yield*/, connection.manager.save(image3)];
                case 3:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "post #1";
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 4:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "post #2";
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 5:
                    _a.sent();
                    post3 = new Post_1.Post();
                    post3.title = "post #3";
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "images")
                            .of(post1)
                            .add(image1)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["images"] })];
                case 8:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.images).to.deep.include({ id: 1, url: "image #1" });
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["images"] })];
                case 9:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.images).to.be.eql([]);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["images"] })];
                case 10:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.images).to.be.eql([]);
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "images")
                            .of(post1)
                            .remove(image1)];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["images"] })];
                case 12:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.images).to.not.contain({ id: 1, url: "image #1" });
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["images"] })];
                case 13:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.images).to.be.eql([]);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["images"] })];
                case 14:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.images).to.be.eql([]);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should add entity relation of a given entity by entity id", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var image1, image2, image3, post1, post2, post3, loadedPost1, loadedPost2, loadedPost3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    image1 = new Image_1.Image();
                    image1.url = "image #1";
                    return [4 /*yield*/, connection.manager.save(image1)];
                case 1:
                    _a.sent();
                    image2 = new Image_1.Image();
                    image2.url = "image #2";
                    return [4 /*yield*/, connection.manager.save(image2)];
                case 2:
                    _a.sent();
                    image3 = new Image_1.Image();
                    image3.url = "image #3";
                    return [4 /*yield*/, connection.manager.save(image3)];
                case 3:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "post #1";
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 4:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "post #2";
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 5:
                    _a.sent();
                    post3 = new Post_1.Post();
                    post3.title = "post #3";
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "images")
                            .of(2) // post id
                            .add(2)];
                case 7:
                    _a.sent(); // image id
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["images"] })];
                case 8:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.images).to.be.eql([]);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["images"] })];
                case 9:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.images).to.deep.include({ id: 2, url: "image #2" });
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["images"] })];
                case 10:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.images).to.be.eql([]);
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "images")
                            .of(2) // post id
                            .remove(2)];
                case 11:
                    _a.sent(); // image id
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["images"] })];
                case 12:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.images).to.be.eql([]);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["images"] })];
                case 13:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.images).to.not.contain({ id: 2, url: "image #2" });
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["images"] })];
                case 14:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.images).to.be.eql([]);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should add entity relation of a given entity by entity id map", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var image1, image2, image3, post1, post2, post3, loadedPost1, loadedPost2, loadedPost3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    image1 = new Image_1.Image();
                    image1.url = "image #1";
                    return [4 /*yield*/, connection.manager.save(image1)];
                case 1:
                    _a.sent();
                    image2 = new Image_1.Image();
                    image2.url = "image #2";
                    return [4 /*yield*/, connection.manager.save(image2)];
                case 2:
                    _a.sent();
                    image3 = new Image_1.Image();
                    image3.url = "image #3";
                    return [4 /*yield*/, connection.manager.save(image3)];
                case 3:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "post #1";
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 4:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "post #2";
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 5:
                    _a.sent();
                    post3 = new Post_1.Post();
                    post3.title = "post #3";
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "images")
                            .of({ id: 3 }) // post id
                            .add({ id: 3 })];
                case 7:
                    _a.sent(); // image id
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["images"] })];
                case 8:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.images).to.be.eql([]);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["images"] })];
                case 9:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.images).to.be.eql([]);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["images"] })];
                case 10:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.images).to.deep.include({ id: 3, url: "image #3" });
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "images")
                            .of({ id: 3 }) // post id
                            .remove({ id: 3 })];
                case 11:
                    _a.sent(); // image id
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["images"] })];
                case 12:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.images).to.be.eql([]);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["images"] })];
                case 13:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.images).to.be.eql([]);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["images"] })];
                case 14:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.images).to.not.contain({ id: 3, url: "image #3" });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should add entity relation of a multiple entities", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var image1, image2, image3, post1, post2, post3, loadedPost1, loadedPost2, loadedPost3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    image1 = new Image_1.Image();
                    image1.url = "image #1";
                    return [4 /*yield*/, connection.manager.save(image1)];
                case 1:
                    _a.sent();
                    image2 = new Image_1.Image();
                    image2.url = "image #2";
                    return [4 /*yield*/, connection.manager.save(image2)];
                case 2:
                    _a.sent();
                    image3 = new Image_1.Image();
                    image3.url = "image #3";
                    return [4 /*yield*/, connection.manager.save(image3)];
                case 3:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "post #1";
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 4:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "post #2";
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 5:
                    _a.sent();
                    post3 = new Post_1.Post();
                    post3.title = "post #3";
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "images")
                            .of([{ id: 1 }, { id: 3 }]) // posts
                            .add({ id: 3 })];
                case 7:
                    _a.sent(); // image
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["images"] })];
                case 8:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.images).to.deep.include({ id: 3, url: "image #3" });
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["images"] })];
                case 9:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.images).to.be.eql([]);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["images"] })];
                case 10:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.images).to.deep.include({ id: 3, url: "image #3" });
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "images")
                            .of([{ id: 1 }, { id: 3 }]) // posts
                            .remove({ id: 3 })];
                case 11:
                    _a.sent(); // image
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["images"] })];
                case 12:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.images).to.not.contain({ id: 3, url: "image #3" });
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["images"] })];
                case 13:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.images).to.be.eql([]);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["images"] })];
                case 14:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.images).to.not.not.contain({ id: 3, url: "image #3" });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should add multiple entities into relation of a multiple entities", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var image1, image2, image3, post1, post2, post3, loadedPost1, loadedPost2, loadedPost3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    image1 = new Image_1.Image();
                    image1.url = "image #1";
                    return [4 /*yield*/, connection.manager.save(image1)];
                case 1:
                    _a.sent();
                    image2 = new Image_1.Image();
                    image2.url = "image #2";
                    return [4 /*yield*/, connection.manager.save(image2)];
                case 2:
                    _a.sent();
                    image3 = new Image_1.Image();
                    image3.url = "image #3";
                    return [4 /*yield*/, connection.manager.save(image3)];
                case 3:
                    _a.sent();
                    post1 = new Post_1.Post();
                    post1.title = "post #1";
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 4:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "post #2";
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 5:
                    _a.sent();
                    post3 = new Post_1.Post();
                    post3.title = "post #3";
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "images")
                            .of({ id: 3 }) // post
                            .add([{ id: 1 }, { id: 3 }])];
                case 7:
                    _a.sent(); // images
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["images"] })];
                case 8:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.images).to.be.eql([]);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["images"] })];
                case 9:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.images).to.be.eql([]);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["images"] })];
                case 10:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.images).to.deep.include({ id: 1, url: "image #1" });
                    chai_1.expect(loadedPost3.images).to.deep.include({ id: 3, url: "image #3" });
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "images")
                            .of({ id: 3 }) // post
                            .remove([{ id: 1 }, { id: 3 }])];
                case 11:
                    _a.sent(); // images
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["images"] })];
                case 12:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.images).to.be.eql([]);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["images"] })];
                case 13:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.images).to.be.eql([]);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 3, { relations: ["images"] })];
                case 14:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3.images).to.not.contain({ id: 1, url: "image #1" });
                    chai_1.expect(loadedPost3.images).to.not.contain({ id: 3, url: "image #3" });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=query-builder-relational-add-remove-many-to-many.js.map