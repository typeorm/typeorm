"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
describe("github issues > #1245 `findByIds` ignores `FindManyOptions`", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should filter correctly using findByIds", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2, post3, _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    post1 = new Post_1.Post();
                    post1.name = "some_name";
                    post2 = new Post_1.Post();
                    post2.name = "some_name";
                    post3 = new Post_1.Post();
                    post3.name = "other_name";
                    return [4 /*yield*/, connection.manager.save([post1, post2, post3])];
                case 1:
                    _b.sent();
                    _a = chai_1.expect;
                    return [4 /*yield*/, connection.manager.findByIds(Post_1.Post, [post2.id, post3.id], { name: "some_name" })];
                case 2:
                    _a.apply(void 0, [_b.sent()]).to.eql([post2]);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should filter correctly using findByIds", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2, post3, _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    post1 = new Post_1.Post();
                    post1.name = "some_name";
                    post2 = new Post_1.Post();
                    post2.name = "some_name";
                    post3 = new Post_1.Post();
                    post3.name = "other_name";
                    return [4 /*yield*/, connection.manager.save([post1, post2, post3])];
                case 1:
                    _b.sent();
                    _a = chai_1.expect;
                    return [4 /*yield*/, connection.manager.findByIds(Post_1.Post, [post2.id, post3.id], { where: { name: "some_name" } })];
                case 2:
                    _a.apply(void 0, [_b.sent()]).to.eql([post2]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1245.js.map