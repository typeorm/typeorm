"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Device_1 = require("./entity/Device");
var DeviceInstance_1 = require("./entity/DeviceInstance");
describe("github issues > #695 Join columns are not using correct length", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should set correct length on to join columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, device, deviceInstance;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("device_instances")];
                case 1:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 2:
                    _a.sent();
                    device = new Device_1.Device();
                    device.id = "ABCDEFGHIJKL";
                    device.registrationToken = "123456";
                    return [4 /*yield*/, connection.manager.save(device)];
                case 3:
                    _a.sent();
                    deviceInstance = new DeviceInstance_1.DeviceInstance();
                    deviceInstance.id = "new post";
                    deviceInstance.device = device;
                    deviceInstance.instance = 10;
                    deviceInstance.type = "type";
                    return [4 /*yield*/, connection.manager.save(deviceInstance)];
                case 4:
                    _a.sent();
                    table.findColumnByName("device_id").type.should.be.equal("char");
                    table.findColumnByName("device_id").length.should.be.equal("12");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-695.js.map