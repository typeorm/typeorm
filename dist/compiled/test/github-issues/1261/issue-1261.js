"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var BaseEntity_1 = require("../../../src/repository/BaseEntity");
var Bar_1 = require("./entity/Bar");
var src_1 = require("../../../src");
describe("github issues > #1261 onDelete property on foreign key is not modified on sync", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should modify onDelete property on foreign key on sync", function () { return src_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, metadata;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    BaseEntity_1.BaseEntity.useConnection(connection);
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("bar")];
                case 2:
                    table = _a.sent();
                    table.foreignKeys[0].onDelete.should.be.equal("SET NULL");
                    metadata = connection.getMetadata(Bar_1.Bar);
                    metadata.foreignKeys[0].onDelete = "CASCADE";
                    return [4 /*yield*/, connection.synchronize()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("bar")];
                case 4:
                    table = _a.sent();
                    table.foreignKeys[0].onDelete.should.be.equal("CASCADE");
                    return [4 /*yield*/, queryRunner.release()];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }); });
});
//# sourceMappingURL=issue-1261.js.map