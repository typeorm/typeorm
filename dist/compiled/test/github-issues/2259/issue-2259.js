"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var TableColumn_1 = require("../../../src/schema-builder/table/TableColumn");
var Table_1 = require("../../../src/schema-builder/table/Table");
describe("github issues > #2259 Missing type for generated columns", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        enabledDrivers: ["postgres"],
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("Should create table with generated column", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var id, client;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id = new TableColumn_1.TableColumn({
                        name: "id",
                        type: "uuid",
                        generationStrategy: "uuid",
                        isGenerated: true,
                        isPrimary: true
                    });
                    client = new Table_1.Table({
                        name: "table",
                        columns: [id]
                    });
                    return [4 /*yield*/, connection.createQueryRunner().createTable(client)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-2259.js.map