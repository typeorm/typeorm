"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
var set_1 = require("./set");
describe("github issues > #2779 Could we add support for the MySQL/MariaDB SET data type?", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mariadb", "mysql"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should create column with SET datatype", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    table.findColumnByName("roles").type.should.be.equal("set");
                    return [4 /*yield*/, queryRunner.release()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should persist and hydrate sets", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var targetValue, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    targetValue = [set_1.Role.Support, set_1.Role.Developer];
                    post = new Post_1.Post();
                    post.roles = targetValue;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    post.roles.should.be.deep.equal(targetValue);
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post)];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    loadedPost.roles.should.be.deep.equal(targetValue);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-2779.js.map