"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var User_1 = require("./entity/User");
// TODO: wrong test
describe.skip("github issues > #2147 Lazy load JoinColumn with multiple columns name property is ignored for second reference column", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should create multiple column join for lazy loading relationship", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var username, user, users, updatedBy;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        username = "user name";
                        user = new User_1.User();
                        user.key = 10;
                        user.clientId = 16;
                        user.name = username;
                        user.updatedById = 10;
                        return [4 /*yield*/, connection.manager.save(user)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, connection.manager.find(User_1.User)];
                    case 2:
                        users = _a.sent();
                        return [4 /*yield*/, users[0].updatedBy];
                    case 3:
                        updatedBy = _a.sent();
                        return [2 /*return*/, chai_1.expect(updatedBy.name).to.be.equal(username)];
                }
            });
        }); }));
    });
});
//# sourceMappingURL=issue-2147.js.map