"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
describe("github issues > #3142 Unique constraint not created on embedded entity field", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
                        enabledDrivers: ["postgres"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should create unique constraint on embedded entity", function () { return Promise.all(connections.map(function (connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var queryRunner, table, contactUnique;
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
                        chai_1.expect(table.uniques.length).to.be.equal(2);
                        contactUnique = table.uniques.find(function (unique) { return unique.columnNames.indexOf("email") !== 0; });
                        chai_1.expect(contactUnique).to.be.exist;
                        return [2 /*return*/];
                }
            });
        });
    })); });
});
//# sourceMappingURL=issue-3142.js.map