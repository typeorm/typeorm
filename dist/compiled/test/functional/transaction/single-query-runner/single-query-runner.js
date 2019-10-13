"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
var PostRepository_1 = require("./repository/PostRepository");
describe("transaction > single query runner", function () {
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
    it("should execute all operations in the method in a transaction", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, connection.transaction(function (transactionalEntityManager) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var originalQueryRunner;
                    return tslib_1.__generator(this, function (_a) {
                        originalQueryRunner = transactionalEntityManager.queryRunner;
                        chai_1.expect(originalQueryRunner).to.exist;
                        chai_1.expect(transactionalEntityManager.getRepository(Post_1.Post).queryRunner).to.exist;
                        transactionalEntityManager.getRepository(Post_1.Post).queryRunner.should.be.equal(originalQueryRunner);
                        transactionalEntityManager.getRepository(Post_1.Post).manager.should.be.equal(transactionalEntityManager);
                        transactionalEntityManager.getCustomRepository(PostRepository_1.PostRepository).getManager().should.be.equal(transactionalEntityManager);
                        return [2 /*return*/];
                    });
                }); })];
        });
    }); })); });
    it("should execute all operations in the method in a transaction (#804)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var entityManager, loadedPost1, loadedPost2, loadedPost3, loadedPost4, loadedPost5, loadedPost6;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    entityManager = connection.createQueryRunner().manager;
                    entityManager.should.not.be.equal(connection.manager);
                    entityManager.queryRunner.should.be.equal(entityManager.queryRunner);
                    return [4 /*yield*/, entityManager.save(new Post_1.Post(undefined, "Hello World"))];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, entityManager.queryRunner.startTransaction()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, entityManager.findOne(Post_1.Post, { title: "Hello World" })];
                case 3:
                    loadedPost1 = _a.sent();
                    chai_1.expect(loadedPost1).to.be.eql({ id: 1, title: "Hello World" });
                    return [4 /*yield*/, entityManager.remove(loadedPost1)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, entityManager.findOne(Post_1.Post, { title: "Hello World" })];
                case 5:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2).to.be.undefined;
                    return [4 /*yield*/, entityManager.queryRunner.rollbackTransaction()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, entityManager.findOne(Post_1.Post, { title: "Hello World" })];
                case 7:
                    loadedPost3 = _a.sent();
                    chai_1.expect(loadedPost3).to.be.eql({ id: 1, title: "Hello World" });
                    return [4 /*yield*/, entityManager.queryRunner.startTransaction()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, entityManager.findOne(Post_1.Post, { title: "Hello World" })];
                case 9:
                    loadedPost4 = _a.sent();
                    chai_1.expect(loadedPost4).to.be.eql({ id: 1, title: "Hello World" });
                    return [4 /*yield*/, entityManager.query("DELETE FROM " + connection.driver.escape("post"))];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, entityManager.findOne(Post_1.Post, { title: "Hello World" })];
                case 11:
                    loadedPost5 = _a.sent();
                    chai_1.expect(loadedPost5).to.be.undefined;
                    return [4 /*yield*/, entityManager.queryRunner.rollbackTransaction()];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, entityManager.findOne(Post_1.Post, { title: "Hello World" })];
                case 13:
                    loadedPost6 = _a.sent();
                    chai_1.expect(loadedPost6).to.be.eql({ id: 1, title: "Hello World" });
                    return [4 /*yield*/, entityManager.queryRunner.release()];
                case 14:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=single-query-runner.js.map