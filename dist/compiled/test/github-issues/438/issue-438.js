"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("github issues > #438 how can i define unsigned column?", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"],
                        schemaCreate: true,
                        dropSchema: true
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly create and change column with UNSIGNED and ZEROFILL attributes", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, metadata, idColumnMetadata, numColumnMetadata, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    metadata = connection.getMetadata(Post_1.Post);
                    idColumnMetadata = metadata.findColumnWithPropertyName("id");
                    numColumnMetadata = metadata.findColumnWithPropertyName("num");
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    table.findColumnByName("id").unsigned.should.be.true;
                    table.findColumnByName("num").zerofill.should.be.true;
                    table.findColumnByName("num").unsigned.should.be.true;
                    idColumnMetadata.unsigned = false;
                    numColumnMetadata.zerofill = false;
                    numColumnMetadata.unsigned = false;
                    return [4 /*yield*/, connection.synchronize()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 3:
                    table = _a.sent();
                    table.findColumnByName("id").unsigned.should.be.false;
                    table.findColumnByName("num").zerofill.should.be.false;
                    table.findColumnByName("num").unsigned.should.be.false;
                    return [4 /*yield*/, queryRunner.release()];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-438.js.map