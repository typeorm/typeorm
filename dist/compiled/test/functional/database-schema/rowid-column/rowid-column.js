"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
describe("database-schema > rowid-column", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["cockroachdb"],
                        dropSchema: true,
                        schemaCreate: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should create `rowid` generated column", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("person")];
                case 1:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 2:
                    _a.sent();
                    table.findColumnByName("id").type.should.be.equal("int8");
                    table.findColumnByName("id").isGenerated.should.be.equal(true);
                    table.findColumnByName("id").generationStrategy.should.be.equal("rowid");
                    table.findColumnByName("id2").type.should.be.equal("int8");
                    table.findColumnByName("id2").isGenerated.should.be.equal(true);
                    table.findColumnByName("id2").generationStrategy.should.be.equal("rowid");
                    table.findColumnByName("id3").type.should.be.equal("int8");
                    table.findColumnByName("id3").isGenerated.should.be.equal(true);
                    table.findColumnByName("id3").generationStrategy.should.be.equal("rowid");
                    table.findColumnByName("id4").type.should.be.equal("int8");
                    table.findColumnByName("id4").isGenerated.should.be.equal(true);
                    table.findColumnByName("id4").generationStrategy.should.be.equal("rowid");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=rowid-column.js.map