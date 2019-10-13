"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Person_1 = require("./entity/Person");
describe("entity-schema > columns > mysql", function () {
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
    it("should create columns with different options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
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
                    table.findColumnByName("Id").unsigned.should.be.true;
                    table.findColumnByName("PostCode").zerofill.should.be.true;
                    table.findColumnByName("PostCode").unsigned.should.be.true;
                    table.findColumnByName("PostCode").width.should.be.equal(9);
                    table.findColumnByName("VirtualFullName").asExpression.should.be.equal("concat(`FirstName`,' ',`LastName`)");
                    table.findColumnByName("VirtualFullName").generatedType.should.be.equal("VIRTUAL");
                    table.findColumnByName("StoredFullName").asExpression.should.be.equal("concat(`FirstName`,' ',`LastName`)");
                    table.findColumnByName("StoredFullName").generatedType.should.be.equal("STORED");
                    table.findColumnByName("LastVisitDate").onUpdate.should.be.equal("CURRENT_TIMESTAMP(3)");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=columns-mysql.js.map