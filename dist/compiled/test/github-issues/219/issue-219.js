"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("github issues > #219 FindOptions should be able to resolve null values", function () {
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
    it("should properly query null values", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var promises, i, post1, postsWithoutText1, postsWithText1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promises = [];
                    for (i = 1; i <= 10; i++) {
                        post1 = new Post_1.Post();
                        post1.title = "post #" + i;
                        post1.text = i > 5 ? "about post" : null;
                        promises.push(connection.manager.save(post1));
                    }
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(Post_1.Post, { where: { text: null } })];
                case 2:
                    postsWithoutText1 = _a.sent();
                    postsWithoutText1.length.should.be.equal(5);
                    return [4 /*yield*/, connection.manager.find(Post_1.Post, { where: { text: "about post" } })];
                case 3:
                    postsWithText1 = _a.sent();
                    postsWithText1.length.should.be.equal(5);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-219.js.map