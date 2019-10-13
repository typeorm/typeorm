"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var Car_1 = require("./entity/Car");
var Fruit_1 = require("./entity/Fruit");
describe("github issues > #363 Can't save 2 unrelated entity types in a single persist call", function () {
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
    it("entityManager should allow you to save unrelated entities with one persist call", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var car, fruit, _a, savedCar, savedFruit, cars, fruits;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    car = new Car_1.Car();
                    car.name = "Ferrari";
                    fruit = new Fruit_1.Fruit();
                    fruit.name = "Banana";
                    return [4 /*yield*/, connection.manager.save([car, fruit])];
                case 1:
                    _a = tslib_1.__read.apply(void 0, [_b.sent(), 2]), savedCar = _a[0], savedFruit = _a[1];
                    chai_1.expect(savedFruit).to.have.property("name", "Banana");
                    chai_1.expect(savedFruit).to.be.instanceof(Fruit_1.Fruit);
                    chai_1.expect(savedCar).to.have.property("name", "Ferrari");
                    chai_1.expect(savedCar).to.be.instanceof(Car_1.Car);
                    return [4 /*yield*/, connection.manager.find(Car_1.Car)];
                case 2:
                    cars = _b.sent();
                    // before the changes in this PR, all the tests before this one actually passed
                    chai_1.expect(cars).to.length(1);
                    chai_1.expect(cars[0]).to.have.property("name", "Ferrari");
                    return [4 /*yield*/, connection.manager.find(Fruit_1.Fruit)];
                case 3:
                    fruits = _b.sent();
                    chai_1.expect(fruits).to.length(1);
                    chai_1.expect(fruits[0]).to.have.property("name", "Banana");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("entityManager should allow you to delete unrelated entities with one remove call", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var fruit, fruit2, _a, savedFruit, car, savedCar, cars, fruits;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    fruit = new Fruit_1.Fruit();
                    fruit.name = "Banana";
                    fruit2 = new Fruit_1.Fruit();
                    fruit2.name = "Apple";
                    return [4 /*yield*/, connection.manager.save([fruit, fruit2])];
                case 1:
                    _a = tslib_1.__read.apply(void 0, [_b.sent(), 1]), savedFruit = _a[0];
                    car = new Car_1.Car();
                    car.name = "Ferrari";
                    return [4 /*yield*/, connection.manager.save(car)];
                case 2:
                    savedCar = _b.sent();
                    return [4 /*yield*/, connection.manager.remove([savedCar, savedFruit])];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, connection.manager.find(Car_1.Car)];
                case 4:
                    cars = _b.sent();
                    chai_1.expect(cars).to.length(0);
                    return [4 /*yield*/, connection.manager.find(Fruit_1.Fruit)];
                case 5:
                    fruits = _b.sent();
                    chai_1.expect(fruits).to.length(1);
                    chai_1.expect(fruits[0]).to.have.property("name", "Apple");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-363.js.map