"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var TestEntity_1 = require("./entity/TestEntity");
var chai_1 = require("chai");
var PromiseUtils_1 = require("../../../src/util/PromiseUtils");
describe("github issues > #1014 Transaction doesn't rollback", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should rollback transaction if some operation failed in it", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var testEntity, error, err_1, loadedTestEntity;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    testEntity = new TestEntity_1.TestEntity();
                    testEntity.name = "Hello Test";
                    return [4 /*yield*/, connection.manager.save(testEntity)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, connection.transaction(function (manager) {
                            return PromiseUtils_1.PromiseUtils.settle([
                                manager.remove(TestEntity_1.TestEntity, { id: 1 }),
                                Promise.reject(new Error()),
                                new Promise(function (resolve, reject) { return reject(new Error()); }),
                            ]);
                        })];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    error = err_1;
                    return [3 /*break*/, 5];
                case 5:
                    chai_1.expect(error).to.be.instanceof(Error);
                    return [4 /*yield*/, connection.manager.findOne(TestEntity_1.TestEntity, 1)];
                case 6:
                    loadedTestEntity = _a.sent();
                    chai_1.expect(loadedTestEntity).not.to.be.undefined;
                    loadedTestEntity.should.be.eql({ id: 1, name: "Hello Test" });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1014.js.map