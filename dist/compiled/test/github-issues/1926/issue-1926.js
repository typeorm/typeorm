"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var test_utils_1 = require("../../utils/test-utils");
var Role_1 = require("./entity/Role");
var Event_1 = require("./entity/Event");
var EventRole_1 = require("./entity/EventRole");
// todo: fix later (refactor persistence)
describe.skip("github issues > #1926 Update fails for entity with compound relation-based primary key on OneToMany relationship", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("Should update OneToMany entity with compound relation-based primary key", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var role, event, eventRole;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    role = new Role_1.Role();
                    role.title = "The Boss";
                    return [4 /*yield*/, connection.manager.save(role)];
                case 1:
                    role = _a.sent();
                    event = new Event_1.Event();
                    event.title = "The Big Event";
                    eventRole = new EventRole_1.EventRole();
                    eventRole.description = "Be the boss";
                    eventRole.compensation = "All the money!";
                    eventRole.roleId = role.id;
                    event.roles = [eventRole];
                    return [4 /*yield*/, connection.manager.save(event)];
                case 2:
                    event = _a.sent();
                    event.roles[0].description = "Be a good boss";
                    // Fails with:
                    // QueryFailedError: duplicate key value violates unique constraint "PK_..."
                    return [4 /*yield*/, connection.manager.save(event)];
                case 3:
                    // Fails with:
                    // QueryFailedError: duplicate key value violates unique constraint "PK_..."
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1926.js.map