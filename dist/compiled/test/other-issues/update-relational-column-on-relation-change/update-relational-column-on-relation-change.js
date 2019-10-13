"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
describe("other issues > update relational column on relation change", function () {
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
    it("should update relational column when relation is inserted", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var category1, category2, post, post2, post3;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        category1 = new Category_1.Category();
                        category1.name = "category #1";
                        category2 = new Category_1.Category();
                        category2.name = "category #1";
                        post = new Post_1.Post();
                        post.title = "about categories";
                        post.categories = [category1, category2];
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 1:
                        _a.sent();
                        category1.postId.should.be.equal(1);
                        category2.postId.should.be.equal(1);
                        post2 = new Post_1.Post();
                        post2.title = "post #2";
                        return [4 /*yield*/, connection.manager.save(post2)];
                    case 2:
                        _a.sent();
                        post3 = new Post_1.Post();
                        post3.title = "post #2";
                        return [4 /*yield*/, connection.manager.save(post3)];
                    case 3:
                        _a.sent();
                        category1.post = post2;
                        category2.post = post3;
                        return [4 /*yield*/, connection.manager.save([category1, category2])];
                    case 4:
                        _a.sent();
                        category1.postId.should.be.equal(2);
                        category2.postId.should.be.equal(3);
                        return [2 /*return*/];
                }
            });
        });
    })); });
});
//# sourceMappingURL=update-relational-column-on-relation-change.js.map