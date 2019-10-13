"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("cube-postgres", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"]
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should create correct schema with Postgres' cube type", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var queryRunner, schema, cubeColumn;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = connection.createQueryRunner();
                        return [4 /*yield*/, queryRunner.getTable("post")];
                    case 1:
                        schema = _a.sent();
                        return [4 /*yield*/, queryRunner.release()];
                    case 2:
                        _a.sent();
                        chai_1.expect(schema).not.to.be.undefined;
                        cubeColumn = schema.columns.find(function (tableColumn) {
                            return tableColumn.name === "color" &&
                                tableColumn.type === "cube";
                        });
                        chai_1.expect(cubeColumn).to.not.be.undefined;
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should persist cube correctly", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var color, postRepo, post, persistedPost, foundPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        color = [255, 0, 0];
                        postRepo = connection.getRepository(Post_1.Post);
                        post = new Post_1.Post();
                        post.color = color;
                        return [4 /*yield*/, postRepo.save(post)];
                    case 1:
                        persistedPost = _a.sent();
                        return [4 /*yield*/, postRepo.findOne(persistedPost.id)];
                    case 2:
                        foundPost = _a.sent();
                        chai_1.expect(foundPost).to.exist;
                        chai_1.expect(foundPost.color).to.deep.equal(color);
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should update cube correctly", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var color, color2, postRepo, post, persistedPost, foundPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        color = [255, 0, 0];
                        color2 = [0, 255, 0];
                        postRepo = connection.getRepository(Post_1.Post);
                        post = new Post_1.Post();
                        post.color = color;
                        return [4 /*yield*/, postRepo.save(post)];
                    case 1:
                        persistedPost = _a.sent();
                        return [4 /*yield*/, postRepo.update({ id: persistedPost.id }, { color: color2 })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, postRepo.findOne(persistedPost.id)];
                    case 3:
                        foundPost = _a.sent();
                        chai_1.expect(foundPost).to.exist;
                        chai_1.expect(foundPost.color).to.deep.equal(color2);
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should re-save cube correctly", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var color, color2, postRepo, post, persistedPost, foundPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        color = [255, 0, 0];
                        color2 = [0, 255, 0];
                        postRepo = connection.getRepository(Post_1.Post);
                        post = new Post_1.Post();
                        post.color = color;
                        return [4 /*yield*/, postRepo.save(post)];
                    case 1:
                        persistedPost = _a.sent();
                        persistedPost.color = color2;
                        return [4 /*yield*/, postRepo.save(persistedPost)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, postRepo.findOne(persistedPost.id)];
                    case 3:
                        foundPost = _a.sent();
                        chai_1.expect(foundPost).to.exist;
                        chai_1.expect(foundPost.color).to.deep.equal(color2);
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should be able to order cube by euclidean distance", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var color1, color2, color3, post1, post2, post3, posts, postIds;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        color1 = [255, 0, 0];
                        color2 = [255, 255, 0];
                        color3 = [255, 255, 255];
                        post1 = new Post_1.Post();
                        post1.color = color1;
                        post2 = new Post_1.Post();
                        post2.color = color2;
                        post3 = new Post_1.Post();
                        post3.color = color3;
                        return [4 /*yield*/, connection.manager.save([post1, post2, post3])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Post_1.Post, "post")
                                .orderBy("color <-> '(0, 255, 0)'", "DESC")
                                .getMany()];
                    case 2:
                        posts = _a.sent();
                        postIds = posts.map(function (post) { return post.id; });
                        chai_1.expect(postIds).to.deep.equal([post1.id, post3.id, post2.id]);
                        return [2 /*return*/];
                }
            });
        }); }));
    });
});
//# sourceMappingURL=cube-postgres.js.map