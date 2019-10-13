"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
var src_1 = require("../../../src");
describe("github issues > #3422 cannot save to nested-tree table if schema is used in postgres", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"],
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should not fail when using schema and nested-tree", function () { return src_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var parent, child, user;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.query("CREATE SCHEMA IF NOT EXISTS admin")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.synchronize()];
                case 2:
                    _a.sent();
                    parent = new User_1.User();
                    return [4 /*yield*/, connection.manager.save(parent)];
                case 3:
                    _a.sent();
                    child = new User_1.User();
                    child.manager = parent;
                    return [4 /*yield*/, connection.manager.save(child)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.getRepository(User_1.User).findOne(child.id, { relations: ["manager"] })];
                case 5:
                    user = _a.sent();
                    user.id.should.be.equal(child.id);
                    user.manager.id.should.be.equal(parent.id);
                    return [2 /*return*/];
            }
        });
    }); }); });
});
//# sourceMappingURL=issue-3422.js.map