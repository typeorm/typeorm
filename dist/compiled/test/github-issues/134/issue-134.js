"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
describe("github issues > #134 Error TIME is converted to 'HH-mm' instead of 'HH:mm", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql", "mariadb", "sqlite", "mssql", "postgres"] // Oracle does not support TIME data type.
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should successfully persist the post with creationDate in HH:mm and return persisted entity", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, currentDate, savedPost, loadedPost, hours, minutes, seconds;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    currentDate = new Date();
                    post.title = "Hello Post #1";
                    post.creationDate = currentDate;
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    savedPost = _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .where("post.id=:id", { id: savedPost.id })
                            .getOne()];
                case 2:
                    loadedPost = _a.sent();
                    hours = String(currentDate.getHours());
                    minutes = String(currentDate.getMinutes());
                    seconds = String(currentDate.getSeconds());
                    hours = hours.length === 1 ? "0" + hours : hours;
                    minutes = minutes.length === 1 ? "0" + minutes : minutes;
                    seconds = seconds.length === 1 ? "0" + seconds : seconds;
                    chai_1.expect(loadedPost).not.to.be.undefined;
                    loadedPost.creationDate.should.be.equal(hours + ":" + minutes + ":" + seconds);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-134.js.map