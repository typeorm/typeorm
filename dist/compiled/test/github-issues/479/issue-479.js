"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var Car_1 = require("./entity/Car");
describe("github issues > #479 orWhere breaks skip / take", function () {
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
    it("where expression of the skip/take should not break original where query", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var car1, car2, car3, car4, car5, car6, cars;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    car1 = new Car_1.Car();
                    car1.name = "Test1";
                    car2 = new Car_1.Car();
                    car2.name = "Test2";
                    car3 = new Car_1.Car();
                    car3.name = "Test3";
                    car4 = new Car_1.Car();
                    car4.name = "BMW";
                    car5 = new Car_1.Car();
                    car5.name = "Mercedes";
                    car6 = new Car_1.Car();
                    car6.name = "Porshe";
                    return [4 /*yield*/, connection
                            .getRepository(Car_1.Car)
                            .save([car1, car2, car3, car4, car5, car6])];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .getRepository(Car_1.Car)
                            .createQueryBuilder("car")
                            .where("car.name LIKE :filter1", { filter1: "Test%" })
                            .orWhere("car.name LIKE :filter2", { filter2: "BM%" })
                            .orderBy("car.id")
                            .skip(0)
                            .take(1)
                            .getMany()];
                case 2:
                    cars = _a.sent();
                    chai_1.expect(cars.length).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-479.js.map