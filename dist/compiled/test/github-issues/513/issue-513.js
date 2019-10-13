"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
var DateUtils_1 = require("../../../src/util/DateUtils");
describe("github issues > #513 Incorrect time/datetime types for SQLite", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["sqlite"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should create datetime column type for datetime in sqlite", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var dbColumns, columnType;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.manager.query("PRAGMA table_info(Post)")];
                case 1:
                    dbColumns = _a.sent();
                    chai_1.expect(dbColumns).not.to.be.null;
                    chai_1.expect(dbColumns).not.to.be.undefined;
                    columnType = "";
                    dbColumns.map(function (dbColumn) {
                        if (dbColumn["name"] === "dateTimeColumn") {
                            columnType = dbColumn["type"];
                        }
                    });
                    // Expect "datetime" type to translate to SQLite affinity type "DATETIME"
                    columnType.should.equal("datetime");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should persist correct type in datetime column in sqlite", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var now, post, storedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = new Date();
                    post = new Post_1.Post();
                    post.id = 1;
                    post.dateTimeColumn = now;
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, post.id)];
                case 2:
                    storedPost = _a.sent();
                    chai_1.expect(storedPost).to.not.be.null;
                    storedPost.dateTimeColumn.toDateString().should.equal(now.toDateString());
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should create datetime column type for time in sqlite", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var dbColumns, columnType;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.manager.query("PRAGMA table_info(Post)")];
                case 1:
                    dbColumns = _a.sent();
                    chai_1.expect(dbColumns).not.to.be.null;
                    chai_1.expect(dbColumns).not.to.be.undefined;
                    columnType = "";
                    dbColumns.map(function (dbColumn) {
                        if (dbColumn["name"] === "timeColumn") {
                            columnType = dbColumn["type"];
                        }
                    });
                    // Expect "time" type to translate to SQLite type "TEXT"
                    columnType.should.equal("time");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should persist correct type in datetime column in sqlite", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var now, post, storedPost, expectedTimeString;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = new Date();
                    post = new Post_1.Post();
                    post.id = 2;
                    post.timeColumn = now; // Should maybe use Date type?
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, post.id)];
                case 2:
                    storedPost = _a.sent();
                    chai_1.expect(storedPost).to.not.be.null;
                    expectedTimeString = DateUtils_1.DateUtils.mixedTimeToString(now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds());
                    storedPost.timeColumn.toString().should.equal(expectedTimeString);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-513.js.map