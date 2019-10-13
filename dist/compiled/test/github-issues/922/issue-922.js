"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("github issues > #922 Support HSTORE column type", function () {
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
    it("should correctly implement HSTORE type", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, postRepository, table, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    postRepository = connection.getRepository(Post_1.Post);
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    post = new Post_1.Post();
                    post.hstoreObj = { name: "Alice", surname: "A", age: 25 };
                    post.hstoreStr = "name => Bob, surname => B, age => 30";
                    return [4 /*yield*/, postRepository.save(post)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1)];
                case 3:
                    loadedPost = _a.sent();
                    loadedPost.hstoreObj.name.should.be.equal("Alice");
                    loadedPost.hstoreObj.surname.should.be.equal("A");
                    loadedPost.hstoreObj.age.should.be.equal("25");
                    loadedPost.hstoreStr.should.be.equal("\"age\"=>\"30\", \"name\"=>\"Bob\", \"surname\"=>\"B\"");
                    table.findColumnByName("hstoreObj").type.should.be.equal("hstore");
                    return [4 /*yield*/, queryRunner.release()];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-922.js.map