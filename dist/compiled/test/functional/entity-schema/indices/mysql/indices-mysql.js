"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Person_1 = require("./entity/Person");
describe("entity-schema > indices > mysql", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Person_1.PersonSchema],
                        enabledDrivers: ["mysql"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly create SPATIAL and FULLTEXT indices", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, spatialIndex, fulltextIndex;
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
                    spatialIndex = table.indices.find(function (index) { return !!index.isSpatial; });
                    spatialIndex.should.be.exist;
                    fulltextIndex = table.indices.find(function (index) { return !!index.isFulltext; });
                    fulltextIndex.should.be.exist;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=indices-mysql.js.map