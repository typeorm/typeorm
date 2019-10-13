"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var CockroachDriver_1 = require("../../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../../utils/test-utils");
var PostIncrement_1 = require("./entity/PostIncrement");
var PostUuid_1 = require("./entity/PostUuid");
var PostDefaultValues_1 = require("./entity/PostDefaultValues");
var PostSpecialColumns_1 = require("./entity/PostSpecialColumns");
var chai_1 = require("chai");
var PostMultiplePrimaryKeys_1 = require("./entity/PostMultiplePrimaryKeys");
var PostComplex_1 = require("./entity/PostComplex");
var PostEmbedded_1 = require("./entity/PostEmbedded");
describe("persistence > entity updation", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({ __dirname: __dirname })];
            case 1: return [2 /*return*/, connections = _a.sent()];
        }
    }); }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should update generated auto-increment id after saving", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new PostIncrement_1.PostIncrement();
                    post.text = "Hello Post";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    // CockroachDB does not use incremental ids
                    if (!(connection.driver instanceof CockroachDriver_1.CockroachDriver))
                        post.id.should.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should update generated uuid after saving", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new PostUuid_1.PostUuid();
                    post.text = "Hello Post";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(PostUuid_1.PostUuid)];
                case 2:
                    loadedPost = _a.sent();
                    post.id.should.be.equal(loadedPost.id);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should update default values after saving", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new PostDefaultValues_1.PostDefaultValues();
                    post.title = "Post #1";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    post.title.should.be.equal("Post #1");
                    post.text.should.be.equal("hello post");
                    post.isActive.should.be.equal(true);
                    post.addDate.should.be.instanceof(Date);
                    post.views.should.be.equal(0);
                    chai_1.expect(post.description).to.be.equal(null);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should update special columns after saving", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new PostSpecialColumns_1.PostSpecialColumns();
                    post.title = "Post #1";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    post.title.should.be.equal("Post #1");
                    post.createDate.should.be.instanceof(Date);
                    post.updateDate.should.be.instanceof(Date);
                    post.version.should.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should update even when multiple primary keys are used", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new PostMultiplePrimaryKeys_1.PostMultiplePrimaryKeys();
                    post.firstId = 1;
                    post.secondId = 3;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    post.firstId.should.be.equal(1);
                    post.secondId.should.be.equal(3);
                    post.text.should.be.equal("Hello Multi Ids");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should update even with embeddeds", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new PostComplex_1.PostComplex();
                    post.firstId = 1;
                    post.embed = new PostEmbedded_1.PostEmbedded();
                    post.embed.secondId = 3;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    post.firstId.should.be.equal(1);
                    post.embed.secondId.should.be.equal(3);
                    post.embed.createDate.should.be.instanceof(Date);
                    post.embed.updateDate.should.be.instanceof(Date);
                    post.embed.version.should.be.equal(1);
                    post.text.should.be.equal("Hello Complexity");
                    return [4 /*yield*/, connection.manager.findOne(PostComplex_1.PostComplex, { firstId: 1, embed: { secondId: 3 } })];
                case 2:
                    loadedPost = _a.sent();
                    loadedPost.firstId.should.be.equal(1);
                    loadedPost.embed.secondId.should.be.equal(3);
                    loadedPost.embed.createDate.should.be.instanceof(Date);
                    loadedPost.embed.updateDate.should.be.instanceof(Date);
                    loadedPost.embed.version.should.be.equal(1);
                    loadedPost.text.should.be.equal("Hello Complexity");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=persistence-entity-updation.js.map