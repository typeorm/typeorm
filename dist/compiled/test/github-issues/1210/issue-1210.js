"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
var Event_1 = require("./entity/Event");
describe("github issues > #1210 mongodb does not have multiple entities properly", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mongodb"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should save entities properly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var event1, event2, event3, event4, user1, user2, users, events;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event1 = new Event_1.Event();
                    event1.date = new Date();
                    event1.name = "Doing a lil hassle with the typeorm";
                    event2 = new Event_1.Event();
                    event2.date = new Date("11/06/2018");
                    event2.name = "Continue with the development of My Partners in Sports App";
                    event3 = new Event_1.Event();
                    event3.date = new Date("11/06/2018");
                    event3.name = "Continue with the development of My Partners in Sports App";
                    event4 = new Event_1.Event();
                    event4.date = new Date("11/06/2018");
                    event4.name = "Continue with the development of My Partners in Sports App";
                    user1 = new User_1.User();
                    user1.firstName = "Vovan";
                    user1.lastName = "Supa";
                    user1.age = 34;
                    user1.events = [event1, event2];
                    user2 = new User_1.User();
                    user2.firstName = "Alex1";
                    user2.lastName = "Coola1";
                    user2.age = 71;
                    user2.events = [event2, event3, event4];
                    users = [user1, user2];
                    events = [event1, event2, event3, event4];
                    return [4 /*yield*/, connection.mongoManager.save(events)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.mongoManager.save(users)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1210.js.map