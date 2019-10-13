"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var UserEntity_1 = require("./entity/UserEntity");
var UserToOrganizationEntity_1 = require("./entity/UserToOrganizationEntity");
var OrganizationEntity_1 = require("./entity/OrganizationEntity");
describe("github issues > #1703 Many to Many with association table returns odd values.", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should work as expected", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user2, user3, organization1, organization2, organization3, userOrganization1, userOrganization2, userOrganization3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new UserEntity_1.UserEntity();
                    user2 = new UserEntity_1.UserEntity();
                    user3 = new UserEntity_1.UserEntity();
                    return [4 /*yield*/, connection.manager.save(user1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(user2)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(user3)];
                case 3:
                    _a.sent();
                    organization1 = new OrganizationEntity_1.OrganizationEntity();
                    organization2 = new OrganizationEntity_1.OrganizationEntity();
                    organization3 = new OrganizationEntity_1.OrganizationEntity();
                    return [4 /*yield*/, connection.manager.save(organization1)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(organization2)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(organization3)];
                case 6:
                    _a.sent();
                    userOrganization1 = new UserToOrganizationEntity_1.UserToOrganizationEntity();
                    userOrganization1.role = "owner";
                    userOrganization1.user = user1;
                    userOrganization1.organization = organization1;
                    return [4 /*yield*/, connection.manager.save(userOrganization1)];
                case 7:
                    _a.sent();
                    userOrganization2 = new UserToOrganizationEntity_1.UserToOrganizationEntity();
                    userOrganization2.role = "owner";
                    userOrganization2.user = user2;
                    userOrganization2.organization = organization2;
                    return [4 /*yield*/, connection.manager.save(userOrganization2)];
                case 8:
                    _a.sent();
                    userOrganization3 = new UserToOrganizationEntity_1.UserToOrganizationEntity();
                    userOrganization3.role = "owner";
                    userOrganization3.user = user2;
                    userOrganization3.organization = organization3;
                    return [4 /*yield*/, connection.manager.save(userOrganization3)];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(OrganizationEntity_1.OrganizationEntity, "organization")
                            .leftJoinAndSelect("organization.users", "users")
                            .getMany()];
                case 10:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1703.js.map