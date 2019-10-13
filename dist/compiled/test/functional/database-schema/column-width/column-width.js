"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
var test_utils_1 = require("../../../utils/test-utils");
describe("database schema > column width", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post],
                        enabledDrivers: ["mysql"],
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("all types should be created with correct width", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 2:
                    _a.sent();
                    chai_1.expect(table.findColumnByName("int").width).to.be.equal(10);
                    chai_1.expect(table.findColumnByName("tinyint").width).to.be.equal(2);
                    chai_1.expect(table.findColumnByName("smallint").width).to.be.equal(3);
                    chai_1.expect(table.findColumnByName("mediumint").width).to.be.equal(9);
                    chai_1.expect(table.findColumnByName("bigint").width).to.be.equal(10);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should update data type display width", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var metadata, queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    metadata = connection.getMetadata(Post_1.Post);
                    metadata.findColumnWithPropertyName("int").width = 5;
                    metadata.findColumnWithPropertyName("tinyint").width = 3;
                    metadata.findColumnWithPropertyName("smallint").width = 4;
                    metadata.findColumnWithPropertyName("mediumint").width = 10;
                    metadata.findColumnWithPropertyName("bigint").width = 11;
                    return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 2:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    chai_1.expect(table.findColumnByName("int").width).to.be.equal(5);
                    chai_1.expect(table.findColumnByName("tinyint").width).to.be.equal(3);
                    chai_1.expect(table.findColumnByName("smallint").width).to.be.equal(4);
                    chai_1.expect(table.findColumnByName("mediumint").width).to.be.equal(10);
                    chai_1.expect(table.findColumnByName("bigint").width).to.be.equal(11);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=column-width.js.map