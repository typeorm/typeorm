"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("persistence > persistence options > chunks", function () {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({ __dirname: __dirname, enabledDrivers: ["postgres"] })];
            case 1: return [2 /*return*/, connections = _a.sent()];
        }
    }); }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    it("should save objects in chunks", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var posts, i, post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    posts = [];
                    for (i = 0; i < 25000; i++) { // CI falls on Node 4 with 100000 rows
                        post = new Post_1.Post();
                        post.title = "Bakhrom " + i;
                        post.description = "Hello" + i;
                        posts.push(post);
                    }
                    return [4 /*yield*/, connection.manager.save(posts, { chunk: 5000 })];
                case 1:
                    _a.sent(); // CI falls on Node 4 with 10000 chunks
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=persistence-options-chunks.js.map