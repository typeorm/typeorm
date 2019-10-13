"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
var Counters_1 = require("./entity/Counters");
var test_utils_1 = require("../../../utils/test-utils");
var Subcounters_1 = require("../embedded-many-to-one-case2/entity/Subcounters");
describe("embedded > embedded-with-special-columns", function () {
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
    it("should insert, load, update and remove entities with embeddeds when embeds contains special columns (e.g. CreateDateColumn, UpdateDateColumn, VersionColumn", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2, loadedPosts, loadedPost, prevUpdateDate;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post1 = new Post_1.Post();
                    post1.id = 1;
                    post1.title = "About cars";
                    post1.counters = new Counters_1.Counters();
                    post1.counters.comments = 1;
                    post1.counters.favorites = 2;
                    post1.counters.likes = 3;
                    post1.counters.subcounters = new Subcounters_1.Subcounters();
                    post1.counters.subcounters.watches = 5;
                    return [4 /*yield*/, connection.getRepository(Post_1.Post).save(post1)];
                case 1:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.id = 2;
                    post2.title = "About airplanes";
                    post2.counters = new Counters_1.Counters();
                    post2.counters.comments = 2;
                    post2.counters.favorites = 3;
                    post2.counters.likes = 4;
                    post2.counters.subcounters = new Subcounters_1.Subcounters();
                    post2.counters.subcounters.watches = 10;
                    return [4 /*yield*/, connection.getRepository(Post_1.Post).save(post2)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .orderBy("post.id")
                            .getMany()];
                case 3:
                    loadedPosts = _a.sent();
                    chai_1.expect(loadedPosts[0].counters.createdDate.should.be.instanceof(Date));
                    chai_1.expect(loadedPosts[0].counters.updatedDate.should.be.instanceof(Date));
                    chai_1.expect(loadedPosts[0].counters.subcounters.version.should.be.equal(1));
                    chai_1.expect(loadedPosts[1].counters.createdDate.should.be.instanceof(Date));
                    chai_1.expect(loadedPosts[1].counters.updatedDate.should.be.instanceof(Date));
                    chai_1.expect(loadedPosts[1].counters.subcounters.version.should.be.equal(1));
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .orderBy("post.id")
                            .where("post.id = :id", { id: 1 })
                            .getOne()];
                case 4:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.counters.createdDate.should.be.instanceof(Date));
                    chai_1.expect(loadedPost.counters.updatedDate.should.be.instanceof(Date));
                    chai_1.expect(loadedPost.counters.subcounters.version.should.be.equal(1));
                    prevUpdateDate = loadedPost.counters.updatedDate;
                    loadedPost.title = "About cars #2";
                    return [4 /*yield*/, test_utils_1.sleep(1000)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Post_1.Post).save(loadedPost)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .where("post.id = :id", { id: 1 })
                            .getOne()];
                case 7:
                    loadedPost = _a.sent();
                    chai_1.expect((loadedPost.counters.updatedDate.valueOf()).should.be.greaterThan(prevUpdateDate.valueOf()));
                    chai_1.expect(loadedPost.counters.subcounters.version.should.be.equal(2));
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=embedded-with-special-columns.js.map