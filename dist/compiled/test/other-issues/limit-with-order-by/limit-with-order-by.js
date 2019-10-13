"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
var Category_1 = require("./entity/Category");
describe("other issues > using limit in conjunction with order by", function () {
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
    it("should persist successfully and return persisted entity", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var i, post, i_1, category, loadedPosts1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        i = 1;
                        _a.label = 1;
                    case 1:
                        if (!(i <= 100)) return [3 /*break*/, 4];
                        post = new Post_1.Post();
                        post.title = "Hello Post #" + i;
                        post.categories = [];
                        for (i_1 = 1; i_1 <= 5; i_1++) {
                            category = new Category_1.Category();
                            category.name = "category #" + i_1;
                            post.categories.push(category);
                        }
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .innerJoinAndSelect("post.categories", "categories")
                            .take(10)
                            .orderBy("post.id", "DESC")
                            .getMany()];
                    case 5:
                        loadedPosts1 = _a.sent();
                        chai_1.expect(loadedPosts1).not.to.be.undefined;
                        loadedPosts1.length.should.be.equal(10);
                        loadedPosts1[0].id.should.be.equal(100);
                        loadedPosts1[1].id.should.be.equal(99);
                        loadedPosts1[2].id.should.be.equal(98);
                        loadedPosts1[3].id.should.be.equal(97);
                        loadedPosts1[4].id.should.be.equal(96);
                        loadedPosts1[5].id.should.be.equal(95);
                        loadedPosts1[6].id.should.be.equal(94);
                        loadedPosts1[7].id.should.be.equal(93);
                        loadedPosts1[8].id.should.be.equal(92);
                        loadedPosts1[9].id.should.be.equal(91);
                        return [2 /*return*/];
                }
            });
        });
    })); });
});
//# sourceMappingURL=limit-with-order-by.js.map