"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var Post_1 = require("./entity/Post");
var test_utils_1 = require("../../../../utils/test-utils");
describe("database schema > column collation > mysql", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"],
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly create column with collation option", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, queryRunner, table, post;
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
                    post.id = 1;
                    post.name = "Post";
                    post.title = "Post #1";
                    post.description = "This is post";
                    return [4 /*yield*/, postRepository.save(post)];
                case 3:
                    _a.sent();
                    table.findColumnByName("name").charset.should.be.equal("ascii");
                    table.findColumnByName("name").collation.should.be.equal("ascii_general_ci");
                    table.findColumnByName("title").charset.should.be.equal("utf8");
                    table.findColumnByName("title").collation.should.be.equal("utf8_general_ci");
                    table.findColumnByName("description").charset.should.be.equal("cp852");
                    table.findColumnByName("description").collation.should.be.equal("cp852_general_ci");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=column-collation-mysql.js.map