"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
// todo: fix this test
describe("github issues > #176 @CreateDateColumn and @UpdateDateColumn does not read back in UTC", function () {
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
    it("should return dates in utc", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, loadedPosts1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post1 = new Post_1.Post();
                    post1.title = "Hello Post #1";
                    post1.date = new Date(1484069886663); // stores "2017-01-10 17:38:06.000" into the database
                    // post1.localDate = new Date(1484069886663); // stores "2017-01-10 22:38:06.000" into the database
                    // persist
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 1:
                    // post1.localDate = new Date(1484069886663); // stores "2017-01-10 22:38:06.000" into the database
                    // persist
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, { where: { title: "Hello Post #1" } })];
                case 2:
                    loadedPosts1 = _a.sent();
                    chai_1.expect(loadedPosts1).not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-176.js.map