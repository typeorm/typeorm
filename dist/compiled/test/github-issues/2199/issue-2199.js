"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var chai_1 = require("chai");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Bar_1 = require("./entity/Bar");
describe("github issues > #2199 - Inserting value for @PrimaryGeneratedColumn() for mysql and sqlite", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql", "mariadb", "sqlite"],
                        schemaCreate: true,
                        dropSchema: true
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should allow to explicitly insert primary key value", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var firstBarQuery, firstBar, secondBarQuery, secondBar, thirdBarQuery, thirdBar;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    firstBarQuery = connection.manager.create(Bar_1.Bar, {
                        id: 10,
                        description: "forced id value"
                    });
                    return [4 /*yield*/, connection.manager.save(firstBarQuery)];
                case 1:
                    firstBar = _a.sent();
                    chai_1.expect(firstBar.id).to.eql(10);
                    secondBarQuery = connection.manager.create(Bar_1.Bar, {
                        description: "default next id value"
                    });
                    return [4 /*yield*/, connection.manager.save(secondBarQuery)];
                case 2:
                    secondBar = _a.sent();
                    chai_1.expect(secondBar.id).to.eql(firstBarQuery.id + 1);
                    thirdBarQuery = connection.manager.create(Bar_1.Bar, {
                        id: 5,
                        description: "lower forced id value"
                    });
                    return [4 /*yield*/, connection.manager.save(thirdBarQuery)];
                case 3:
                    thirdBar = _a.sent();
                    chai_1.expect(thirdBar.id).to.eql(5);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-2199.js.map