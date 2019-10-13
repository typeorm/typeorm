"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var path = require("path");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
var test_utils_1 = require("../../utils/test-utils");
var PlatformTools_1 = require("../../../src/platform/PlatformTools");
describe("sqljs driver > startup", function () {
    var connections;
    var pathToSqlite = path.resolve(__dirname, "startup.sqlite");
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post],
                        schemaCreate: true,
                        dropSchema: true,
                        enabledDrivers: ["sqljs"],
                        driverSpecific: {
                            autoSave: true,
                            location: pathToSqlite,
                        }
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should startup even if the file doesn't exist", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            // if we come this far, test was successful as a connection was established
            chai_1.expect(connection).to.not.be.null;
            return [2 /*return*/];
        });
    }); })); });
    it("should write a new file after first write operation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, repository;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post();
                    post.title = "The title";
                    repository = connection.getRepository(Post_1.Post);
                    return [4 /*yield*/, repository.save(post)];
                case 1:
                    _a.sent();
                    chai_1.expect(PlatformTools_1.PlatformTools.fileExist(pathToSqlite)).to.be.true;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=startup.js.map