"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
describe("persistence > cascade operations with custom name", function () {
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
    describe("cascade update", function () {
        var _this = this;
        it("should remove relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var post1, category1, posts;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        post1 = new Post_1.Post();
                        post1.title = "Hello Post #1";
                        category1 = new Category_1.Category();
                        category1.name = "Category saved by cascades #1";
                        category1.posts = [post1];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 1:
                        _a.sent();
                        category1.posts = [];
                        return [4 /*yield*/, connection.manager.save(category1)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, connection.manager.find(Post_1.Post, {
                                join: {
                                    alias: "post",
                                    leftJoinAndSelect: {
                                        category: "post.category"
                                    }
                                },
                                order: {
                                    id: "ASC"
                                }
                            })];
                    case 3:
                        posts = _a.sent();
                        posts.should.be.eql([{
                                id: 1,
                                title: "Hello Post #1",
                                category: null
                            }]);
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
});
//# sourceMappingURL=custom-column-name-pk.js.map