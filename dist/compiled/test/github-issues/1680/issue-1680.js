"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var User_1 = require("./entity/User");
var chai_1 = require("chai");
describe("github issues > #1680 Delete & Update applies to all entities in table if criteria is undefined or empty", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("Delete & Update should throw an error when supplied with an empty criteria", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var e_1, _a, e_2, _b, userA, userB, userC, problematicCriterias, _loop_1, problematicCriterias_1, problematicCriterias_1_1, criteria, e_1_1, _loop_2, problematicCriterias_2, problematicCriterias_2_1, criteria, e_2_1;
        return tslib_1.__generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    userA = new User_1.User();
                    userA.name = "User A";
                    userB = new User_1.User();
                    userB.name = "User B";
                    userC = new User_1.User();
                    userC.name = "User C";
                    return [4 /*yield*/, connection.manager.save([userA, userB, userC])];
                case 1:
                    _c.sent();
                    problematicCriterias = [null, undefined, [], ""];
                    _loop_1 = function (criteria) {
                        var error;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    error = null;
                                    return [4 /*yield*/, connection.manager.delete(User_1.User, criteria).catch(function (err) { return error = err; })];
                                case 1:
                                    _a.sent();
                                    chai_1.expect(error).to.be.instanceof(Error);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 7, 8, 9]);
                    problematicCriterias_1 = tslib_1.__values(problematicCriterias), problematicCriterias_1_1 = problematicCriterias_1.next();
                    _c.label = 3;
                case 3:
                    if (!!problematicCriterias_1_1.done) return [3 /*break*/, 6];
                    criteria = problematicCriterias_1_1.value;
                    return [5 /*yield**/, _loop_1(criteria)];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5:
                    problematicCriterias_1_1 = problematicCriterias_1.next();
                    return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 9];
                case 7:
                    e_1_1 = _c.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 9];
                case 8:
                    try {
                        if (problematicCriterias_1_1 && !problematicCriterias_1_1.done && (_a = problematicCriterias_1.return)) _a.call(problematicCriterias_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7 /*endfinally*/];
                case 9:
                    _loop_2 = function (criteria) {
                        var error;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    error = null;
                                    return [4 /*yield*/, connection.manager.update(User_1.User, criteria, {
                                            name: "Override Name"
                                        }).catch(function (err) { return error = err; })];
                                case 1:
                                    _a.sent();
                                    chai_1.expect(error).to.be.instanceof(Error);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _c.label = 10;
                case 10:
                    _c.trys.push([10, 15, 16, 17]);
                    problematicCriterias_2 = tslib_1.__values(problematicCriterias), problematicCriterias_2_1 = problematicCriterias_2.next();
                    _c.label = 11;
                case 11:
                    if (!!problematicCriterias_2_1.done) return [3 /*break*/, 14];
                    criteria = problematicCriterias_2_1.value;
                    return [5 /*yield**/, _loop_2(criteria)];
                case 12:
                    _c.sent();
                    _c.label = 13;
                case 13:
                    problematicCriterias_2_1 = problematicCriterias_2.next();
                    return [3 /*break*/, 11];
                case 14: return [3 /*break*/, 17];
                case 15:
                    e_2_1 = _c.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 17];
                case 16:
                    try {
                        if (problematicCriterias_2_1 && !problematicCriterias_2_1.done && (_b = problematicCriterias_2.return)) _b.call(problematicCriterias_2);
                    }
                    finally { if (e_2) throw e_2.error; }
                    return [7 /*endfinally*/];
                case 17: 
                // Ensure normal deleting works
                return [4 /*yield*/, connection.manager.delete(User_1.User, 3)];
                case 18:
                    // Ensure normal deleting works
                    _c.sent();
                    // Ensure normal updating works
                    return [4 /*yield*/, connection.manager.update(User_1.User, 2, { name: "User B Updated" })];
                case 19:
                    // Ensure normal updating works
                    _c.sent();
                    // All users should still exist except for User C
                    return [4 /*yield*/, connection.manager.find(User_1.User).should.eventually.eql([{
                                id: 1,
                                name: "User A"
                            }, {
                                id: 2,
                                name: "User B Updated"
                            }])];
                case 20:
                    // All users should still exist except for User C
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1680.js.map