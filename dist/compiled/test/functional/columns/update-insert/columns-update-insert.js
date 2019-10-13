"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("columns > update and insert control", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should respect column update and insert properties", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "About columns";
                    post.text = "Some text about columns";
                    post.authorFirstName = "Umed";
                    post.authorMiddleName = "B";
                    post.authorLastName = "Good";
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(post.id)];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.title).to.be.equal("About columns");
                    chai_1.expect(loadedPost.text).to.be.equal("Some text about columns");
                    chai_1.expect(loadedPost.authorFirstName).to.be.equal("Umed");
                    chai_1.expect(loadedPost.authorMiddleName).to.be.equal("Default"); // insert blocked
                    chai_1.expect(loadedPost.authorLastName).to.be.equal("Default"); // insert blocked
                    // then update all its properties and save again
                    post.title = "About columns1";
                    post.text = "Some text about columns1";
                    post.authorFirstName = "Umed1";
                    post.authorMiddleName = "B1";
                    post.authorLastName = "Good1";
                    return [4 /*yield*/, postRepository.save(post)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(post.id)];
                case 4:
                    // check if all columns are as expected
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.title).to.be.equal("About columns1");
                    chai_1.expect(loadedPost.text).to.be.equal("Some text about columns1");
                    chai_1.expect(loadedPost.authorFirstName).to.be.equal("Umed"); // update blocked
                    chai_1.expect(loadedPost.authorMiddleName).to.be.equal("B1");
                    chai_1.expect(loadedPost.authorLastName).to.be.equal("Default"); // update blocked
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=columns-update-insert.js.map