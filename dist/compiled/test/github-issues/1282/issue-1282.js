"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
var Animal_1 = require("./entity/Animal");
var NamingStrategyUnderTest_1 = require("./naming/NamingStrategyUnderTest");
describe("github issue > #1282 FEATURE REQUEST - Naming strategy joinTableColumnName if it is called from the owning or owned (inverse) context ", function () {
    var connections;
    var namingStrategy = new NamingStrategyUnderTest_1.NamingStrategyUnderTest();
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        namingStrategy: namingStrategy
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () {
        return test_utils_1.reloadTestingDatabases(connections);
    });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("NamingStrategyUnderTest#", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var metadata, columns;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(Animal_1.Animal).find()];
                case 1:
                    _a.sent();
                    metadata = connection.getManyToManyMetadata(Animal_1.Animal, "categories");
                    if (metadata !== undefined) {
                        columns = metadata.columns;
                    }
                    else {
                        columns = [];
                    }
                    chai_1.expect(columns.find(function (column) { return column.databaseName === "animalIdForward"; }))
                        .not.to.be.undefined;
                    chai_1.expect(columns.find(function (column) { return column.databaseName === "categoryIdInverse"; }))
                        .not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1282.js.map