"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var chai_1 = require("chai");
var Person_1 = require("./entity/Person");
var MysqlDriver_1 = require("../../../../src/driver/mysql/MysqlDriver");
var AbstractSqliteDriver_1 = require("../../../../src/driver/sqlite-abstract/AbstractSqliteDriver");
describe("entity-schema > uniques", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Person_1.PersonSchema],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should create an unique constraint with 2 columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
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
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        chai_1.expect(table.indices.length).to.be.equal(1);
                        chai_1.expect(table.indices[0].name).to.be.equal("UNIQUE_TEST");
                        chai_1.expect(table.indices[0].isUnique).to.be.true;
                        chai_1.expect(table.indices[0].columnNames.length).to.be.equal(2);
                        chai_1.expect(table.indices[0].columnNames).to.deep.include.members(["FirstName", "LastName"]);
                    }
                    else if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver) {
                        chai_1.expect(table.uniques.length).to.be.equal(1);
                        chai_1.expect(table.uniques[0].columnNames.length).to.be.equal(2);
                        chai_1.expect(table.uniques[0].columnNames).to.deep.include.members(["FirstName", "LastName"]);
                    }
                    else {
                        chai_1.expect(table.uniques.length).to.be.equal(1);
                        chai_1.expect(table.uniques[0].name).to.be.equal("UNIQUE_TEST");
                        chai_1.expect(table.uniques[0].columnNames.length).to.be.equal(2);
                        chai_1.expect(table.uniques[0].columnNames).to.deep.include.members(["FirstName", "LastName"]);
                    }
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=uniques-basic.js.map