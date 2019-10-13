"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var user_1 = require("./entity/user");
describe("github issues > #966 Inheritance in embeddables", function () {
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
    it("should save and load Superclass fields in embeddable", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var repository, info, user, loadedUser;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    repository = connection.getRepository(user_1.User);
                    info = new user_1.UserInfo();
                    info.firstName = "Ed";
                    info.lastName = "Edd";
                    info.userName = "Eddy";
                    info.address = "github.com";
                    user = new user_1.User();
                    user.info = info;
                    return [4 /*yield*/, repository.save(user)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, repository.findOne(user.id)];
                case 2:
                    loadedUser = _a.sent();
                    chai_1.expect(info).to.deep.equal(loadedUser.info);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-966.js.map