"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
describe("query builder > entity updation", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({ __dirname: __dirname })];
            case 1: return [2 /*return*/, connections = _a.sent()];
        }
    }); }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should update entity model after insertion if updateEntity is set to true", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "about entity updation in query builder";
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(Post_1.Post)
                            .values(post)
                            .updateEntity(true)
                            .execute()];
                case 1:
                    _a.sent();
                    post.title.should.be.equal("about entity updation in query builder");
                    post.order.should.be.equal(100);
                    post.createDate.should.be.instanceof(Date);
                    post.updateDate.should.be.instanceof(Date);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should not update entity model after insertion if updateEntity is set to false", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "about entity updation in query builder";
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(Post_1.Post)
                            .values(post)
                            .updateEntity(false)
                            .execute()];
                case 1:
                    _a.sent();
                    chai_1.expect(post.id).to.be.undefined;
                    post.title.should.be.equal("about entity updation in query builder");
                    chai_1.expect(post.order).to.be.undefined;
                    chai_1.expect(post.createDate).to.be.undefined;
                    chai_1.expect(post.updateDate).to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should not override already set properties", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "about entity updation in query builder";
                    post.order = 101;
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .insert()
                            .into(Post_1.Post)
                            .values(post)
                            .updateEntity(true)
                            .execute()];
                case 1:
                    _a.sent();
                    post.title.should.be.equal("about entity updation in query builder");
                    post.order.should.be.equal(101);
                    post.createDate.should.be.instanceof(Date);
                    post.updateDate.should.be.instanceof(Date);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should update entity model after save", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "about entity updation in query builder";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    post.version.should.be.equal(1);
                    return [4 /*yield*/, connection.manager.save(post)];
                case 2:
                    _a.sent();
                    post.version.should.be.equal(1);
                    post.title = "changed title";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 3:
                    _a.sent();
                    post.version.should.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should update special entity properties after entity updation if updateEntity is set to true", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "about entity updation in query builder";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    post.version.should.be.equal(1);
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .update(Post_1.Post)
                            .set({ title: "again changed title" })
                            .whereEntity(post)
                            .updateEntity(true)
                            .execute()];
                case 2:
                    _a.sent();
                    post.version.should.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should not update special entity properties after entity updation if updateEntity is set to true", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "about entity updation in query builder";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    post.version.should.be.equal(1);
                    return [4 /*yield*/, connection.createQueryBuilder()
                            .update(Post_1.Post)
                            .set({ title: "again changed title" })
                            .whereEntity(post)
                            .updateEntity(false)
                            .execute()];
                case 2:
                    _a.sent();
                    post.version.should.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=entity-updation.js.map