"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
var Plan_1 = require("./entity/Plan");
var Item_1 = require("./entity/Item");
var MysqlDriver_1 = require("../../../src/driver/mysql/MysqlDriver");
describe("github issues > #1476 subqueries", function () {
    var connections = [];
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql", "mariadb", "sqlite", "sqljs"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var planRepo, itemRepo, plan1, item1, item2, plans, plan;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    planRepo = connection.getRepository(Plan_1.Plan);
                    itemRepo = connection.getRepository(Item_1.Item);
                    plan1 = new Plan_1.Plan();
                    plan1.planId = 1;
                    plan1.planName = "Test";
                    return [4 /*yield*/, planRepo.save(plan1)];
                case 1:
                    _a.sent();
                    item1 = new Item_1.Item();
                    item1.itemId = 1;
                    item1.planId = 1;
                    item2 = new Item_1.Item();
                    item2.itemId = 2;
                    item2.planId = 1;
                    return [4 /*yield*/, itemRepo.save([item1, item2])];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, planRepo
                            .createQueryBuilder("b")
                            .leftJoinAndSelect(function (subQuery) {
                            return subQuery
                                .select("COUNT(\"planId\")", "total")
                                .addSelect("planId")
                                .from(Item_1.Item, "items")
                                .groupBy("items.planId");
                        }, "i", "i.planId = b.planId")
                            .getRawMany()];
                case 3:
                    plans = _a.sent();
                    chai_1.expect(plans).to.not.be.undefined;
                    plan = plans[0];
                    chai_1.expect(plan.b_planId).to.be.equal(1);
                    chai_1.expect(plan.b_planName).to.be.equal("Test");
                    chai_1.expect(plan.planId).to.be.equal(1);
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        chai_1.expect(plan.total).to.be.equal("2");
                    }
                    else {
                        chai_1.expect(plan.total).to.be.equal(2);
                    }
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1476.js.map