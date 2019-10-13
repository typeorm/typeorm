"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var User_1 = require("./entity/User");
describe("github issues > #4220 Fix the bug when using buffer as the key.", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                        enabledDrivers: ["mysql", "mssql"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should use the hex string format of buffer when the primary column is buffer type.", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var ids, repo, result;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ids = [
                        "11E9845B84B510E0A99EDBC51EED5BB5",
                        "11E9845B84C27E60A99EDBC51EED5BB5",
                        "11E9845B84D961C0A99EDBC51EED5BB5",
                        "11E9845B84DD8070A99EDBC51EED5BB5",
                        "11E9845B84E102E0A99EDBC51EED5BB5",
                        "11E9845B84E4D370A99EDBC51EED5BB5",
                        "11E9845B84E855E0A99EDBC51EED5BB5",
                        "11E9845B84EBD850A99EDBC51EED5BB5",
                        "11E9845B84EFF700A99EDBC51EED5BB5",
                        "11E9845B84F415B0A99EDBC51EED5BB5",
                        "11E9845B84FA5740A99EDBC51EED5BB5",
                        "11E9845B84FEC410A99EDBC51EED5BB5",
                        "11E9845B850C0A80A99EDBC51EED5BB5",
                        "11E9845B850FB400A99EDBC51EED5BB5",
                        "11E9845B85138490A99EDBC51EED5BB5",
                        "11E9845B851950F0A99EDBC51EED5BB5",
                        "11E9845B851D6FA0A99EDBC51EED5BB5",
                        "11E9845B85214030A99EDBC51EED5BB5",
                        "11E9845B852510C0A99EDBC51EED5BB5",
                    ];
                    return [4 /*yield*/, connection.getRepository(User_1.User)];
                case 1:
                    repo = _a.sent();
                    return [4 /*yield*/, Promise.all(tslib_1.__spread(Array(10)).map(function (_, index) {
                            var user = new User_1.User();
                            user.name = "random-name";
                            user.id = Buffer.from(ids[index], "hex");
                            return user;
                        }).map(function (user) { return repo.save(user); }))];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, repo
                            .createQueryBuilder("user")
                            .getMany()];
                case 3:
                    result = _a.sent();
                    chai_1.expect(result.length).equal(10);
                    chai_1.expect(result[0].id.toString("hex").toUpperCase()).equal(ids[0]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-4220.js.map