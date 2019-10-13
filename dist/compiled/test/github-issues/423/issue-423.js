"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../utils/test-utils");
describe("github issues > #423 Cannot use Group as Table name && cannot autoSchemeSync when use alias Entity", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: false,
                        dropSchema: true
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should successfully sync schema", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("groups")];
                case 2:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    table.should.exist;
                    // CockroachDB stores unique indices as UNIQUE constraints
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver) {
                        table.uniques.length.should.be.equal(1);
                        table.uniques[0].name.should.be.equal("Groups name");
                        table.uniques[0].columnNames[0].should.be.equal("name");
                    }
                    else {
                        table.indices.length.should.be.equal(1);
                        table.indices[0].name.should.be.equal("Groups name");
                        table.indices[0].columnNames[0].should.be.equal("name");
                        table.indices[0].isUnique.should.be.true;
                    }
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-423.js.map