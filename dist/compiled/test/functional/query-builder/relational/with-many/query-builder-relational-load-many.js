"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var Post_1 = require("./entity/Post");
var Image_1 = require("./entity/Image");
var test_utils_1 = require("../../../../utils/test-utils");
var chai_1 = require("chai");
describe("query builder > relational with many > load many", function () {
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
    it("should load relation entity of a given entity object", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var image1, image2, image3, post1, post2, post3, loadedPost1, _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    image1 = new Image_1.Image();
                    image1.url = "image #1";
                    return [4 /*yield*/, connection.manager.save(image1)];
                case 1:
                    _b.sent();
                    image2 = new Image_1.Image();
                    image2.url = "image #2";
                    return [4 /*yield*/, connection.manager.save(image2)];
                case 2:
                    _b.sent();
                    image3 = new Image_1.Image();
                    image3.url = "image #3";
                    return [4 /*yield*/, connection.manager.save(image3)];
                case 3:
                    _b.sent();
                    post1 = new Post_1.Post();
                    post1.title = "post #1";
                    post1.images = [image1, image2];
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 4:
                    _b.sent();
                    post2 = new Post_1.Post();
                    post2.title = "post #2";
                    post2.images = [image2, image3];
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 5:
                    _b.sent();
                    post3 = new Post_1.Post();
                    post3.title = "post #3";
                    post3.images = [image1, image3];
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1)];
                case 7:
                    loadedPost1 = _b.sent();
                    _a = loadedPost1;
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "images")
                            .of(post1)
                            .loadMany()];
                case 8:
                    _a.images = _b.sent();
                    chai_1.expect(loadedPost1.images).to.deep.include({ id: 1, url: "image #1" });
                    chai_1.expect(loadedPost1.images).to.deep.include({ id: 2, url: "image #2" });
                    chai_1.expect(loadedPost1.images).to.not.contain({ id: 3, url: "image #3" });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load relation entity of a given entity id map", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var image1, image2, image3, post1, post2, post3, loadedPost1, _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    image1 = new Image_1.Image();
                    image1.url = "image #1";
                    return [4 /*yield*/, connection.manager.save(image1)];
                case 1:
                    _b.sent();
                    image2 = new Image_1.Image();
                    image2.url = "image #2";
                    return [4 /*yield*/, connection.manager.save(image2)];
                case 2:
                    _b.sent();
                    image3 = new Image_1.Image();
                    image3.url = "image #3";
                    return [4 /*yield*/, connection.manager.save(image3)];
                case 3:
                    _b.sent();
                    post1 = new Post_1.Post();
                    post1.title = "post #1";
                    post1.images = [image1, image2];
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 4:
                    _b.sent();
                    post2 = new Post_1.Post();
                    post2.title = "post #2";
                    post2.images = [image2, image3];
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 5:
                    _b.sent();
                    post3 = new Post_1.Post();
                    post3.title = "post #3";
                    post3.images = [image1, image3];
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1)];
                case 7:
                    loadedPost1 = _b.sent();
                    _a = loadedPost1;
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "images")
                            .of({ id: 1 })
                            .loadMany()];
                case 8:
                    _a.images = _b.sent();
                    chai_1.expect(loadedPost1.images).to.deep.include({ id: 1, url: "image #1" });
                    chai_1.expect(loadedPost1.images).to.deep.include({ id: 2, url: "image #2" });
                    chai_1.expect(loadedPost1.images).to.not.contain({ id: 3, url: "image #3" });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load relation entity of a given entity id", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var image1, image2, image3, post1, post2, post3, loadedPost1, _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    image1 = new Image_1.Image();
                    image1.url = "image #1";
                    return [4 /*yield*/, connection.manager.save(image1)];
                case 1:
                    _b.sent();
                    image2 = new Image_1.Image();
                    image2.url = "image #2";
                    return [4 /*yield*/, connection.manager.save(image2)];
                case 2:
                    _b.sent();
                    image3 = new Image_1.Image();
                    image3.url = "image #3";
                    return [4 /*yield*/, connection.manager.save(image3)];
                case 3:
                    _b.sent();
                    post1 = new Post_1.Post();
                    post1.title = "post #1";
                    post1.images = [image1, image2];
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 4:
                    _b.sent();
                    post2 = new Post_1.Post();
                    post2.title = "post #2";
                    post2.images = [image2, image3];
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 5:
                    _b.sent();
                    post3 = new Post_1.Post();
                    post3.title = "post #3";
                    post3.images = [image1, image3];
                    return [4 /*yield*/, connection.manager.save(post3)];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1)];
                case 7:
                    loadedPost1 = _b.sent();
                    _a = loadedPost1;
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "images")
                            .of(1)
                            .loadMany()];
                case 8:
                    _a.images = _b.sent();
                    chai_1.expect(loadedPost1.images).to.deep.include({ id: 1, url: "image #1" });
                    chai_1.expect(loadedPost1.images).to.deep.include({ id: 2, url: "image #2" });
                    chai_1.expect(loadedPost1.images).to.not.contain({ id: 3, url: "image #3" });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=query-builder-relational-load-many.js.map