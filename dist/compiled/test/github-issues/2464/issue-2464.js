"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Foo_1 = require("./entity/Foo");
var src_1 = require("../../../src");
var chai_1 = require("chai");
describe("github issues > #2464 - ManyToMany onDelete option not working", function () {
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
    it("should not delete when onDelete is 'NO ACTION'", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var repo, e_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    repo = connection.getRepository(Foo_1.Foo);
                    return [4 /*yield*/, repo.save({ id: 1, bars: [{ description: "test1" }] })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, repo.delete(1)];
                case 3:
                    _a.sent();
                    chai_1.expect.fail();
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    e_1.should.be.instanceOf(src_1.QueryFailedError);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); })); });
    it("should delete when onDelete is not set", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var repo, foo;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    repo = connection.getRepository(Foo_1.Foo);
                    return [4 /*yield*/, repo.save({ id: 1, otherBars: [{ description: "test1" }] })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, repo.delete(1)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, repo.findOne(1)];
                case 3:
                    foo = _a.sent();
                    chai_1.expect(foo).to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-2464.js.map