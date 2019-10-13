"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var chai_1 = require("chai");
describe("github issues > #2632 createQueryBuilder relation remove works only if using ID", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should add and remove relations of an entity if given a mix of ids and objects", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2, category1, category2, loadedPost1, loadedPost2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post1 = new Post_1.Post();
                    post1.title = "post #1";
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 1:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.title = "post #2";
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 2:
                    _a.sent();
                    category1 = new Category_1.Category();
                    category1.title = "category #1";
                    return [4 /*yield*/, connection.manager.save(category1)];
                case 3:
                    _a.sent();
                    category2 = new Category_1.Category();
                    category2.title = "category #2";
                    return [4 /*yield*/, connection.manager.save(category2)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "categories")
                            .of(post1)
                            .add(1)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["categories"] })];
                case 6:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.categories).to.deep.include({ id: 1, title: "category #1" });
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "categories")
                            .of(post1)
                            .remove(1)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1, { relations: ["categories"] })];
                case 8:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.categories).to.be.eql([]);
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "categories")
                            .of(2)
                            .add(category2)];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["categories"] })];
                case 10:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.categories).to.deep.include({ id: 2, title: "category #2" });
                    return [4 /*yield*/, connection
                            .createQueryBuilder()
                            .relation(Post_1.Post, "categories")
                            .of(2)
                            .remove(category2)];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 2, { relations: ["categories"] })];
                case 12:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1.categories).to.be.eql([]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-2632.js.map