"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Counters_1 = require("./entity/Counters");
var chai_1 = require("chai");
describe("mongodb > array columns", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post, Counters_1.Counters],
                        enabledDrivers: ["mongodb"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should insert / update array columns correctly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, loadedPost, loadedUpdatedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "Post";
                    post.names = ["umed", "dima", "bakhrom"];
                    post.numbers = [1, 0, 1];
                    post.booleans = [true, false, false];
                    post.counters = [
                        new Counters_1.Counters(1, "number #1"),
                        new Counters_1.Counters(2, "number #2"),
                        new Counters_1.Counters(3, "number #3"),
                    ];
                    post.other1 = [];
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne({ title: "Post" })];
                case 2:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost).to.be.not.empty;
                    chai_1.expect(loadedPost.names).to.be.not.empty;
                    chai_1.expect(loadedPost.numbers).to.be.not.empty;
                    chai_1.expect(loadedPost.booleans).to.be.not.empty;
                    chai_1.expect(loadedPost.counters).to.be.not.empty;
                    loadedPost.other1.length.should.be.equal(0);
                    chai_1.expect(loadedPost.other2).to.be.undefined;
                    loadedPost.names[0].should.be.equal("umed");
                    loadedPost.names[1].should.be.equal("dima");
                    loadedPost.names[2].should.be.equal("bakhrom");
                    loadedPost.numbers[0].should.be.equal(1);
                    loadedPost.numbers[1].should.be.equal(0);
                    loadedPost.numbers[2].should.be.equal(1);
                    loadedPost.booleans[0].should.be.equal(true);
                    loadedPost.booleans[1].should.be.equal(false);
                    loadedPost.booleans[2].should.be.equal(false);
                    loadedPost.counters[0].should.be.instanceOf(Counters_1.Counters);
                    loadedPost.counters[1].should.be.instanceOf(Counters_1.Counters);
                    loadedPost.counters[2].should.be.instanceOf(Counters_1.Counters);
                    loadedPost.counters[0].likes.should.be.equal(1);
                    loadedPost.counters[1].likes.should.be.equal(2);
                    loadedPost.counters[2].likes.should.be.equal(3);
                    loadedPost.counters[0].text.should.be.equal("number #1");
                    loadedPost.counters[1].text.should.be.equal("number #2");
                    loadedPost.counters[2].text.should.be.equal("number #3");
                    // now update the post
                    post.names = ["umed!", "dima!", "bakhrom!"];
                    post.numbers = [11, 10, 11];
                    post.booleans = [true, true, true];
                    post.counters = [
                        new Counters_1.Counters(11, "number #11"),
                        new Counters_1.Counters(12, "number #12"),
                    ];
                    post.other1 = [
                        new Counters_1.Counters(0, "other"),
                    ];
                    return [4 /*yield*/, postRepository.save(post)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne({ title: "Post" })];
                case 4:
                    loadedUpdatedPost = _a.sent();
                    chai_1.expect(loadedUpdatedPost).to.be.not.empty;
                    chai_1.expect(loadedUpdatedPost.names).to.be.not.empty;
                    chai_1.expect(loadedUpdatedPost.numbers).to.be.not.empty;
                    chai_1.expect(loadedUpdatedPost.booleans).to.be.not.empty;
                    chai_1.expect(loadedUpdatedPost.counters).to.be.not.empty;
                    chai_1.expect(loadedUpdatedPost.other1).to.be.not.empty;
                    chai_1.expect(loadedUpdatedPost.other2).to.be.undefined;
                    loadedUpdatedPost.names[0].should.be.equal("umed!");
                    loadedUpdatedPost.names[1].should.be.equal("dima!");
                    loadedUpdatedPost.names[2].should.be.equal("bakhrom!");
                    loadedUpdatedPost.numbers[0].should.be.equal(11);
                    loadedUpdatedPost.numbers[1].should.be.equal(10);
                    loadedUpdatedPost.numbers[2].should.be.equal(11);
                    loadedUpdatedPost.booleans[0].should.be.equal(true);
                    loadedUpdatedPost.booleans[1].should.be.equal(true);
                    loadedUpdatedPost.booleans[2].should.be.equal(true);
                    loadedUpdatedPost.counters[0].should.be.instanceOf(Counters_1.Counters);
                    loadedUpdatedPost.counters[1].should.be.instanceOf(Counters_1.Counters);
                    loadedUpdatedPost.counters[0].likes.should.be.equal(11);
                    loadedUpdatedPost.counters[1].likes.should.be.equal(12);
                    loadedUpdatedPost.counters[0].text.should.be.equal("number #11");
                    loadedUpdatedPost.counters[1].text.should.be.equal("number #12");
                    loadedUpdatedPost.other1[0].should.be.instanceOf(Counters_1.Counters);
                    loadedUpdatedPost.other1[0].likes.should.be.equal(0);
                    loadedUpdatedPost.other1[0].text.should.be.equal("other");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=mongodb-array-columns.js.map