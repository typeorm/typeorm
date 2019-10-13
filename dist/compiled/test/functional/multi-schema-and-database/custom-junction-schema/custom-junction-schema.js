"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var chai_1 = require("chai");
describe("multi-schema-and-database > custom-junction-schema", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post, Category_1.Category],
                        enabledDrivers: ["mssql", "postgres"],
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly create tables when custom table schema used", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, postTable, categoryTable, junctionMetadata, junctionTable;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("yoman.post")];
                case 1:
                    postTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("yoman.category")];
                case 2:
                    categoryTable = _a.sent();
                    junctionMetadata = connection.getManyToManyMetadata(Post_1.Post, "categories");
                    return [4 /*yield*/, queryRunner.getTable("yoman." + junctionMetadata.tableName)];
                case 3:
                    junctionTable = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 4:
                    _a.sent();
                    chai_1.expect(postTable).not.to.be.undefined;
                    postTable.name.should.be.equal("yoman.post");
                    chai_1.expect(categoryTable).not.to.be.undefined;
                    categoryTable.name.should.be.equal("yoman.category");
                    chai_1.expect(junctionTable).not.to.be.undefined;
                    junctionTable.name.should.be.equal("yoman." + junctionMetadata.tableName);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=custom-junction-schema.js.map