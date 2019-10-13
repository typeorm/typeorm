"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var test_utils_1 = require("../../utils/test-utils");
describe("mssql -> add column to existing table", function () {
    var connections;
    beforeEach(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        enabledDrivers: ["mssql"],
                        entities: [__dirname + "/entity/Post{.js,.ts}"]
                    })];
                case 1:
                    connections = (_a.sent());
                    return [4 /*yield*/, Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, connection.synchronize(true)];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, connection.getRepository("Post").insert({ title: "test" })];
                                    case 2:
                                        _a.sent();
                                        return [4 /*yield*/, connection.close()];
                                    case 3:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.closeTestingConnections(connections)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it("should fail to add column", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        enabledDrivers: ["mssql"],
                        entities: [__dirname + "/entity/Post-Fail{.js,.ts}"]
                    })];
                case 1:
                    connections = (_a.sent());
                    return [4 /*yield*/, Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, connection.synchronize().should.eventually.rejectedWith("Error: ALTER TABLE only allows columns to be added that can contain nulls, or have a DEFAULT definition specified, or the column being added is an identity or timestamp column, or alternatively if none of the previous conditions are satisfied the table must be empty to allow addition of this column. Column 'addedField' cannot be added to non-empty table 'post' because it does not satisfy these conditions.")];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it("should succeed to add column", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        enabledDrivers: ["mssql"],
                        entities: [__dirname + "/entity/Post-Succeed{.js,.ts}"]
                    })];
                case 1:
                    connections = (_a.sent());
                    return [4 /*yield*/, Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var post;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, connection.synchronize().should.eventually.eq(undefined)];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, connection.getRepository("Post").findOne()];
                                    case 2:
                                        post = _a.sent();
                                        if (!post) {
                                            throw "Post should exist";
                                        }
                                        post.should.exist;
                                        post.id.should.be.eq(1);
                                        post.title.should.be.eq("test");
                                        post.addedField.should.be.eq("default value");
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=mssql-add-column-with-default-value.js.map