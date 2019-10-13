"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var fs = require("fs");
var path = require("path");
var chai_1 = require("chai");
var index_1 = require("../../../src/index");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("sqljs driver > save", function () {
    var pathToSqlite = path.resolve(__dirname, "export.sqlite");
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post],
                        schemaCreate: true,
                        dropSchema: true,
                        enabledDrivers: ["sqljs"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should save to file", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, repository, manager;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (fs.existsSync(pathToSqlite)) {
                        fs.unlinkSync(pathToSqlite);
                    }
                    post = new Post_1.Post();
                    post.title = "The second title";
                    repository = connection.getRepository(Post_1.Post);
                    return [4 /*yield*/, repository.save(post)];
                case 1:
                    _a.sent();
                    manager = index_1.getSqljsManager("sqljs");
                    return [4 /*yield*/, manager.saveDatabase(pathToSqlite)];
                case 2:
                    _a.sent();
                    chai_1.expect(fs.existsSync(pathToSqlite)).to.be.true;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should load a file that was saved", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var manager, repository, post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = index_1.getSqljsManager("sqljs");
                    return [4 /*yield*/, manager.loadDatabase(pathToSqlite)];
                case 1:
                    _a.sent();
                    repository = connection.getRepository(Post_1.Post);
                    return [4 /*yield*/, repository.findOne({ title: "The second title" })];
                case 2:
                    post = _a.sent();
                    chai_1.expect(post).not.to.be.undefined;
                    if (post) {
                        chai_1.expect(post.title).to.be.equal("The second title");
                    }
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=save.js.map