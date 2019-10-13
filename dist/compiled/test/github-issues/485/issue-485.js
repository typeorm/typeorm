"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("github issues > #485 If I set the datatype of PrimaryGeneratedColumn to uuid then it is not giving the uuid to the column.", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"],
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should persist uuid correctly when it used as PrimaryGeneratedColumn type", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, queryRunner, table, post, savedPost, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 2:
                    _a.sent();
                    post = new Post_1.Post();
                    return [4 /*yield*/, postRepository.save(post)];
                case 3:
                    savedPost = _a.sent();
                    return [4 /*yield*/, postRepository.findOne(savedPost.id)];
                case 4:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).to.be.not.undefined;
                    chai_1.expect(loadedPost.id).to.equal(savedPost.id);
                    table.findColumnByName("id").type.should.be.equal("uuid");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-485.js.map