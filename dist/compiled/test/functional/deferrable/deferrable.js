"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Company_1 = require("./entity/Company");
var Office_1 = require("./entity/Office");
var User_1 = require("./entity/User");
var chai_1 = require("chai");
describe("deferrable fk constraints should be check at the end of transaction (#2191)", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("use initially deferred deferrable fk constraints", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.manager.transaction(function (entityManager) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var user, company;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    user = new User_1.User();
                                    user.id = 1;
                                    user.company = { id: 100 };
                                    user.name = "Bob";
                                    return [4 /*yield*/, entityManager.save(user)];
                                case 1:
                                    _a.sent();
                                    company = new Company_1.Company();
                                    company.id = 100;
                                    company.name = "Acme";
                                    return [4 /*yield*/, entityManager.save(company)];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(User_1.User, {
                            relations: ["company"],
                            where: { id: 1 }
                        })];
                case 2:
                    user = _a.sent();
                    chai_1.expect(user).not.to.be.undefined;
                    user.should.be.eql({
                        id: 1,
                        name: "Bob",
                        company: {
                            id: 100,
                            name: "Acme",
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("use initially immediated deferrable fk constraints", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var office;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.manager.transaction(function (entityManager) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var office, company;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: 
                                // first set constraints deferred manually
                                return [4 /*yield*/, entityManager.query("SET CONSTRAINTS ALL DEFERRED")];
                                case 1:
                                    // first set constraints deferred manually
                                    _a.sent();
                                    office = new Office_1.Office();
                                    office.id = 2;
                                    office.company = { id: 200 };
                                    office.name = "Barcelona";
                                    return [4 /*yield*/, entityManager.save(office)];
                                case 2:
                                    _a.sent();
                                    company = new Company_1.Company();
                                    company.id = 200;
                                    company.name = "Emca";
                                    return [4 /*yield*/, entityManager.save(company)];
                                case 3:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Office_1.Office, {
                            relations: ["company"],
                            where: { id: 2 }
                        })];
                case 2:
                    office = _a.sent();
                    chai_1.expect(office).not.to.be.undefined;
                    office.should.be.eql({
                        id: 2,
                        name: "Barcelona",
                        company: {
                            id: 200,
                            name: "Emca",
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=deferrable.js.map