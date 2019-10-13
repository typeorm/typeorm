"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
var chai_1 = require("chai");
describe("github issues > #2253 - inserting multiple child entities fails", function () {
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
    it("should be able to save multiple child entities", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2, users, _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    user1 = new User_1.SubUser();
                    user1.id = 1;
                    user2 = new User_1.SubUser();
                    user2.id = 2;
                    return [4 /*yield*/, connection.manager.save([user1, user2])];
                case 1:
                    _b.sent();
                    users = connection.getRepository(User_1.SubUser);
                    _a = chai_1.expect;
                    return [4 /*yield*/, users.count()];
                case 2:
                    _a.apply(void 0, [_b.sent()]).to.eql(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-2253.js.map