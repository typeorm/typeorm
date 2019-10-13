"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
var Role_1 = require("./entity/Role");
var User_1 = require("./entity/User");
describe("other issues > using take with multiple primary keys", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1: return [2 /*return*/, (connections = _a.sent())];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should persist successfully and return persisted entity", function () {
        return Promise.all(connections.map(function (connection) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var promises, i, user, i_1, role, loadedUsers1, lefties;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            promises = [];
                            for (i = 1; i <= 100; i++) {
                                user = new User_1.User();
                                user.id = i;
                                user.name = "User " + i;
                                user.handedness = i % 10 === 0 ? "left" : "right";
                                user.roles = [];
                                for (i_1 = 1; i_1 <= 5; i_1++) {
                                    role = new Role_1.Role();
                                    role.name = "role #" + i_1;
                                    user.roles.push(role);
                                }
                                promises.push(connection.manager.save(user));
                            }
                            return [4 /*yield*/, Promise.all(promises)];
                        case 1:
                            _a.sent();
                            chai_1.expect(true).to.be.true;
                            return [4 /*yield*/, connection.manager
                                    .createQueryBuilder(User_1.User, "user")
                                    .innerJoinAndSelect("user.roles", "roles")
                                    .take(10)
                                    .orderBy("user.id", "DESC")
                                    .getMany()];
                        case 2:
                            loadedUsers1 = _a.sent();
                            chai_1.expect(loadedUsers1).not.to.be.undefined;
                            loadedUsers1.length.should.be.equal(10);
                            loadedUsers1[0].id.should.be.equal(100);
                            loadedUsers1[1].id.should.be.equal(99);
                            loadedUsers1[2].id.should.be.equal(98);
                            loadedUsers1[3].id.should.be.equal(97);
                            loadedUsers1[4].id.should.be.equal(96);
                            loadedUsers1[5].id.should.be.equal(95);
                            loadedUsers1[6].id.should.be.equal(94);
                            loadedUsers1[7].id.should.be.equal(93);
                            loadedUsers1[8].id.should.be.equal(92);
                            loadedUsers1[9].id.should.be.equal(91);
                            return [4 /*yield*/, connection.manager
                                    .createQueryBuilder(User_1.User, "user")
                                    .innerJoinAndSelect("user.roles", "roles")
                                    .where("user.handedness = :handedness", { handedness: "left" })
                                    .take(5)
                                    .orderBy("user.id", "DESC")
                                    .getMany()];
                        case 3:
                            lefties = _a.sent();
                            chai_1.expect(lefties).not.to.be.undefined;
                            lefties.length.should.be.equal(5);
                            lefties[0].id.should.be.equal(100);
                            lefties[1].id.should.be.equal(90);
                            lefties[2].id.should.be.equal(80);
                            lefties[3].id.should.be.equal(70);
                            lefties[4].id.should.be.equal(60);
                            lefties[0].roles.length.should.be.equal(5);
                            return [2 /*return*/];
                    }
                });
            });
        }));
    });
});
//# sourceMappingURL=take-multiple-pk.js.map