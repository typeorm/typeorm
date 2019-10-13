"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Entity_1 = require("./entity/Entity");
describe("github issues > #3828 Conflicting PR to fix postgres schema:log with uppercase table names and enums", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Entity_1.MyEntity],
                        enabledDrivers: ["postgres"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("schema sync should work when enum type name was changed", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Rename type to what typeorm 0.2.14 created
                // @see https://github.com/typeorm/typeorm/commit/0338d5eedcaedfd9571a90ebe1975b9b07c8e07a
                return [4 /*yield*/, connection.query("ALTER TYPE \"MyEntity_mycolumn_enum\" RENAME TO \"myentity_mycolumn_enum\"")];
                case 1:
                    // Rename type to what typeorm 0.2.14 created
                    // @see https://github.com/typeorm/typeorm/commit/0338d5eedcaedfd9571a90ebe1975b9b07c8e07a
                    _a.sent();
                    // Sync database, so that typeorm create the table and enum type
                    return [4 /*yield*/, connection.synchronize()];
                case 2:
                    // Sync database, so that typeorm create the table and enum type
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-3828.js.map