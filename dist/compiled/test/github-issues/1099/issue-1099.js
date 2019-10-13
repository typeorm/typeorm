"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Animal_1 = require("./entity/Animal");
var OffsetWithoutLimitNotSupportedError_1 = require("../../../src/error/OffsetWithoutLimitNotSupportedError");
var MysqlDriver_1 = require("../../../src/driver/mysql/MysqlDriver");
describe("github issues > #1099 BUG - QueryBuilder MySQL skip sql is wrong", function () {
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
    it("drivers which does not support offset without limit should throw an exception, other drivers must work fine", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var e_1, _a, animals, animals_1, animals_1_1, animal, e_1_1, qb;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    animals = ["cat", "dog", "bear", "snake"];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, 7, 8]);
                    animals_1 = tslib_1.__values(animals), animals_1_1 = animals_1.next();
                    _b.label = 2;
                case 2:
                    if (!!animals_1_1.done) return [3 /*break*/, 5];
                    animal = animals_1_1.value;
                    return [4 /*yield*/, connection.getRepository(Animal_1.Animal).save({ name: animal })];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    animals_1_1 = animals_1.next();
                    return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 8];
                case 6:
                    e_1_1 = _b.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 8];
                case 7:
                    try {
                        if (animals_1_1 && !animals_1_1.done && (_a = animals_1.return)) _a.call(animals_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7 /*endfinally*/];
                case 8:
                    qb = connection.getRepository(Animal_1.Animal)
                        .createQueryBuilder("a")
                        .leftJoinAndSelect("a.categories", "categories")
                        .orderBy("a.id")
                        .skip(1);
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver)) return [3 /*break*/, 10];
                    return [4 /*yield*/, qb.getManyAndCount().should.be.rejectedWith(OffsetWithoutLimitNotSupportedError_1.OffsetWithoutLimitNotSupportedError)];
                case 9:
                    _b.sent();
                    return [3 /*break*/, 12];
                case 10: return [4 /*yield*/, qb.getManyAndCount().should.eventually.be.eql([[{ id: 2, name: "dog", categories: [] }, { id: 3, name: "bear", categories: [] }, { id: 4, name: "snake", categories: [] },], 4])];
                case 11:
                    _b.sent();
                    _b.label = 12;
                case 12: return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1099.js.map