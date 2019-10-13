"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
describe("github issues > #1576 Entities with null as `id` are merged [@next]", function () {
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
    it("should successfully create object", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var newpost, cat1, cat2, post;
        return tslib_1.__generator(this, function (_a) {
            newpost = new Post_1.Post();
            cat1 = new Category_1.Category();
            cat1.name2 = "1";
            cat2 = new Category_1.Category();
            cat2.name = "2";
            newpost.categories = [cat1, cat2];
            post = connection.manager.create(Post_1.Post, newpost);
            chai_1.expect(post.categories).to.have.length(2);
            return [2 /*return*/];
        });
    }); })); });
});
//# sourceMappingURL=issue-1576.js.map