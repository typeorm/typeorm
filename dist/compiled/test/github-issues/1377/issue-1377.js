"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("github issues > #1377 Add support for `GENERATED ALWAYS AS` in MySQL", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly create table with generated columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, metadata, virtualFullNameColumn, storedFullNameColumn;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    table.findColumnByName("virtualFullName").asExpression.should.be.equal("concat(`firstName`,' ',`lastName`)");
                    table.findColumnByName("virtualFullName").generatedType.should.be.equal("VIRTUAL");
                    table.findColumnByName("storedFullName").asExpression.should.be.equal("concat(`firstName`,' ',`lastName`)");
                    table.findColumnByName("storedFullName").generatedType.should.be.equal("STORED");
                    metadata = connection.getMetadata(Post_1.Post);
                    virtualFullNameColumn = metadata.findColumnWithPropertyName("virtualFullName");
                    virtualFullNameColumn.generatedType = "STORED";
                    storedFullNameColumn = metadata.findColumnWithPropertyName("storedFullName");
                    storedFullNameColumn.asExpression = "concat('Mr. ',`firstName`,' ',`lastName`)";
                    return [4 /*yield*/, connection.synchronize()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 3:
                    table = _a.sent();
                    table.findColumnByName("virtualFullName").generatedType.should.be.equal("STORED");
                    table.findColumnByName("storedFullName").asExpression.should.be.equal("concat('Mr. ',`firstName`,' ',`lastName`)");
                    return [4 /*yield*/, queryRunner.release()];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1377.js.map