"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var User_1 = require("./entity/User");
describe("github issues > #3112 default:null should inserts nulls to database", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [User_1.User],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should insert null when no value specified", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var UserRepository, user1, loadedUser;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    UserRepository = connection.manager.getRepository(User_1.User);
                    user1 = new User_1.User();
                    return [4 /*yield*/, UserRepository.save(user1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, UserRepository.find()];
                case 2:
                    loadedUser = _a.sent();
                    chai_1.expect(loadedUser[0].first).to.be.null;
                    chai_1.expect(loadedUser[0].second).to.be.null;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-3112.js.map