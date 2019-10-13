"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Post_1 = require("./entity/Post");
// import {expect} from "chai";
describe("persistence > persistence options > listeners", function () {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({ __dirname: __dirname })];
            case 1: return [2 /*return*/, connections = _a.sent()];
        }
    }); }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    it("save listeners should work by default", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "Bakhrom";
                    post.description = "Hello";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    post.title.should.be.equal("Bakhrom!");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("save listeners should be disabled if save option is specified", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "Bakhrom";
                    post.description = "Hello";
                    return [4 /*yield*/, connection.manager.save(post, { listeners: false })];
                case 1:
                    _a.sent();
                    post.title.should.be.equal("Bakhrom");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("remove listeners should work by default", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "Bakhrom";
                    post.description = "Hello";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.remove(post)];
                case 2:
                    _a.sent();
                    post.isRemoved.should.be.equal(true);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("remove listeners should be disabled if remove option is specified", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "Bakhrom";
                    post.description = "Hello";
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.remove(post, { listeners: false })];
                case 2:
                    _a.sent();
                    post.isRemoved.should.be.equal(false);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=persistence-options-listeners.js.map