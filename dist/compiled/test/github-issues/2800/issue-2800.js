"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var test_utils_1 = require("../../utils/test-utils");
var Car_1 = require("./entity/Car");
var Plane_1 = require("./entity/Plane");
describe("github issues > #2800 - Can't override embedded entities in STI implementation", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should be able to save entity with embedded entities overriding", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.manager.save(Car_1.Car, connection.manager.create(Car_1.Car, {
                        engine: {
                            horsePower: 42,
                            torque: 42
                        }
                    }))];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(Plane_1.Plane, connection.manager.create(Plane_1.Plane, {
                            engine: {
                                beep: 42,
                                boop: 42
                            }
                        }))];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-2800.js.map