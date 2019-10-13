"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var TestEntity_1 = require("./entity/TestEntity");
describe("github issues > #929 sub-queries should set their own parameters on execution", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should persist successfully and return persisted entity", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var testEntity1, testEntity2, testEntity3, testEntity4, queryBuilder, subQuery, results;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    testEntity1 = new TestEntity_1.TestEntity();
                    testEntity1.name = "Entity #1";
                    return [4 /*yield*/, connection.manager.save(testEntity1)];
                case 1:
                    _a.sent();
                    testEntity2 = new TestEntity_1.TestEntity();
                    testEntity2.name = "Entity #2";
                    return [4 /*yield*/, connection.manager.save(testEntity2)];
                case 2:
                    _a.sent();
                    testEntity3 = new TestEntity_1.TestEntity();
                    testEntity3.name = "Entity #3";
                    return [4 /*yield*/, connection.manager.save(testEntity3)];
                case 3:
                    _a.sent();
                    testEntity4 = new TestEntity_1.TestEntity();
                    testEntity4.name = "Entity #4";
                    return [4 /*yield*/, connection.manager.save(testEntity4)];
                case 4:
                    _a.sent();
                    queryBuilder = connection.manager.createQueryBuilder(TestEntity_1.TestEntity, "testEntity");
                    subQuery = queryBuilder
                        .subQuery()
                        .from(TestEntity_1.TestEntity, "innerTestEntity")
                        .select(["innerTestEntity.id"])
                        .where("innerTestEntity.id = :innerId", { innerId: 1 });
                    return [4 /*yield*/, queryBuilder
                            .select("testEntity")
                            .where("testEntity.id IN " + subQuery.getQuery())
                            .getMany()];
                case 5:
                    results = _a.sent();
                    chai_1.expect(results.length).to.be.equal(1);
                    chai_1.expect(results).to.eql([{ id: 1, name: "Entity #1" }]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-929.js.map