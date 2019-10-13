"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
describe("mongodb > timestampable columns", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post],
                        enabledDrivers: ["mongodb"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should persist timestampable columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var commentMongoRepository, post, createdAt, updatedAt, date, updatedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    commentMongoRepository = connection.getMongoRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.message = "Hello";
                    return [4 /*yield*/, commentMongoRepository.save(post)];
                case 1:
                    _a.sent();
                    chai_1.expect(post.id).to.be.not.undefined;
                    post.createdAt.should.be.instanceof(Date);
                    createdAt = post.createdAt;
                    post.updatedAt.should.be.instanceof(Date);
                    updatedAt = post.updatedAt;
                    // test has +/- delta range of 5 milliseconds, because earlier this test fell due to the difference of 1 millisecond
                    chai_1.expect(post.updatedAt.getTime() - post.createdAt.getTime()).to.be.closeTo(0, 5);
                    date = new Date();
                    date.setFullYear(2001);
                    post.message = "New message";
                    post.createdAt = date;
                    post.updatedAt = date;
                    return [4 /*yield*/, commentMongoRepository.save(post)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, commentMongoRepository.findOne(post.id)];
                case 3:
                    updatedPost = _a.sent();
                    chai_1.expect(updatedPost).to.be.ok;
                    chai_1.expect(updatedPost.createdAt.getTime()).to.equal(createdAt.getTime());
                    chai_1.expect(updatedPost.updatedAt.getTime()).to.gte(updatedAt.getTime());
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=timestampable-columns.js.map