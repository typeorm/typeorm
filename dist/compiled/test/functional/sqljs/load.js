"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var fs = require("fs");
var chai_1 = require("chai");
var index_1 = require("../../../src/index");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("sqljs driver > load", function () {
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
    it("should load from a file", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var manager, repository, post, exportedDatabase, originalFileContent;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = index_1.getSqljsManager("sqljs");
                    return [4 /*yield*/, manager.loadDatabase("test/functional/sqljs/sqlite/test.sqlite")];
                case 1:
                    _a.sent();
                    repository = connection.getRepository(Post_1.Post);
                    return [4 /*yield*/, repository.findOne({ title: "A post" })];
                case 2:
                    post = _a.sent();
                    chai_1.expect(post).not.to.be.undefined;
                    if (post) {
                        chai_1.expect(post.title).to.be.equal("A post");
                    }
                    exportedDatabase = manager.exportDatabase();
                    chai_1.expect(exportedDatabase).not.to.be.undefined;
                    originalFileContent = fs.readFileSync("test/functional/sqljs/sqlite/test.sqlite");
                    chai_1.expect(exportedDatabase.length).to.equal(originalFileContent.length);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should throw an error if the file doesn't exist", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var manager, error_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = index_1.getSqljsManager("sqljs");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, manager.loadDatabase("test/functional/sqljs/sqlite/test2.sqlite")];
                case 2:
                    _a.sent();
                    chai_1.expect(true).to.be.false;
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    chai_1.expect(error_1.message.match(/File .* does not exist/) !== null).to.equal(true, "Should throw: File does not exist");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=load.js.map