"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var ValidationModel_1 = require("./entity/ValidationModel");
var MainModel_1 = require("./entity/MainModel");
var DataModel_1 = require("./entity/DataModel");
describe("github issues > #1545 Typeorm runs insert query instead of update query on save of existing entity for ManyToOne relationships", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should add intial validation data", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var validation1, validation2, _a, _b, _c, data1_1, main1;
        return tslib_1.__generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    validation1 = new ValidationModel_1.ValidationModel();
                    validation1.validation = 123;
                    validation2 = new ValidationModel_1.ValidationModel();
                    validation2.validation = 456;
                    _b = (_a = Promise).all;
                    return [4 /*yield*/, connection.manager.save(validation1)];
                case 1:
                    _c = [_d.sent()];
                    return [4 /*yield*/, connection.manager.save(validation2)];
                case 2: return [4 /*yield*/, _b.apply(_a, [_c.concat([_d.sent()])])];
                case 3:
                    _d.sent();
                    data1_1 = new DataModel_1.DataModel();
                    data1_1.active = true;
                    data1_1.validations = validation1;
                    main1 = new MainModel_1.MainModel();
                    main1.dataModel = [data1_1];
                    return [4 /*yield*/, connection.manager.save(main1)];
                case 4:
                    _d.sent();
                    // console.dir(main1, { colors: true, depth: null });
                    main1.dataModel[0].active = false;
                    return [4 /*yield*/, connection.manager.save(main1)];
                case 5:
                    _d.sent();
                    // console.dir(main1, { colors: true, depth: null });
                    return [2 /*return*/, true];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1545.js.map