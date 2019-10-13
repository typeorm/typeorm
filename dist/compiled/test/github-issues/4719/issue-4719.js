"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("github issues > #4719 HStore with empty string values", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should handle HStore with empty string keys or values", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, postRepository, post, id, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    postRepository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.hstoreObj = { name: "Alice", surname: "A", age: 25, blank: "", "": "blank-key", "\"": "\"", foo: null };
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    id = (_a.sent()).id;
                    return [4 /*yield*/, postRepository.findOneOrFail(id)];
                case 2:
                    loadedPost = _a.sent();
                    loadedPost.hstoreObj.should.be.deep.equal({ name: "Alice", surname: "A", age: "25", blank: "", "": "blank-key", "\"": "\"", foo: null });
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should not allow 'hstore injection'", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, postRepository, post, id, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    postRepository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.hstoreObj = { username: "\", admin=>\"1", admin: "0" };
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    id = (_a.sent()).id;
                    return [4 /*yield*/, postRepository.findOneOrFail(id)];
                case 2:
                    loadedPost = _a.sent();
                    loadedPost.hstoreObj.should.be.deep.equal({ username: "\", admin=>\"1", admin: "0" });
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-4719.js.map