"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("benchmark > bulk-save > case1", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({ __dirname: __dirname, enabledDrivers: ["postgres"] })];
            case 1: return [2 /*return*/, connections = _a.sent()];
        }
    }); }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("testing bulk save of 10.000 objects", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var posts, i, post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    posts = [];
                    for (i = 1; i <= 10000; i++) {
                        post = new Post_1.Post();
                        post.title = "Post #" + i;
                        post.text = "Post #" + i + " text";
                        post.likesCount = i;
                        post.commentsCount = i;
                        post.watchesCount = i;
                        posts.push(post);
                    }
                    return [4 /*yield*/, connection.manager.save(posts)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    /**
     * Before persistence refactoring
     *
     *  MySql
     *
     * √ testing bulk save of 1000 objects (2686ms)
     * √ testing bulk save of 1000 objects (1579ms)
     * √ testing bulk save of 1000 objects (1664ms)
     * √ testing bulk save of 1000 objects (1426ms)
     * √ testing bulk save of 1000 objects (1512ms)
     * √ testing bulk save of 1000 objects (1526ms)
     * √ testing bulk save of 1000 objects (1605ms)
     * √ testing bulk save of 1000 objects (1914ms)
     * √ testing bulk save of 1000 objects (1983ms)
     * √ testing bulk save of 1000 objects (1500ms)
     *
     * Postgres
     *
     * √ testing bulk save of 1000 objects (3704ms)
     * √ testing bulk save of 1000 objects (2080ms)
     * √ testing bulk save of 1000 objects (2176ms)
     * √ testing bulk save of 1000 objects (2447ms)
     * √ testing bulk save of 1000 objects (2259ms)
     * √ testing bulk save of 1000 objects (2112ms)
     * √ testing bulk save of 1000 objects (2193ms)
     * √ testing bulk save of 1000 objects (2211ms)
     * √ testing bulk save of 1000 objects (2282ms)
     * √ testing bulk save of 1000 objects (2551ms)
     *
     * SqlServer
     *
     * √ testing bulk save of 1000 objects (8098ms)
     * √ testing bulk save of 1000 objects (6534ms)
     * √ testing bulk save of 1000 objects (5789ms)
     * √ testing bulk save of 1000 objects (5505ms)
     * √ testing bulk save of 1000 objects (5813ms)
     * √ testing bulk save of 1000 objects (5932ms)
     * √ testing bulk save of 1000 objects (6114ms)
     * √ testing bulk save of 1000 objects (5960ms)
     * √ testing bulk save of 1000 objects (5755ms)
     * √ testing bulk save of 1000 objects (5935ms)
     */
});
//# sourceMappingURL=bulk-save-case1.js.map