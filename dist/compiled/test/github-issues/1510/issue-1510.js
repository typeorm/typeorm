"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var src_1 = require("../../../src");
describe("github issues > #1510 entity schema does not support mode=objectId", function () {
    var UserEntity = new src_1.EntitySchema({
        name: "User",
        tableName: "test_1510_users",
        columns: {
            _id: {
                type: "int",
                objectId: true,
                primary: true,
                generated: true,
            },
            name: {
                type: String,
            }
        }
    });
    var UserWithoutObjectIDEntity = new src_1.EntitySchema({
        name: "UserWithoutObjectID",
        tableName: "test_1510_users2",
        columns: {
            _id: {
                type: "int",
                primary: true,
                generated: true,
            },
            name: {
                type: String,
            }
        }
    });
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}", UserEntity, UserWithoutObjectIDEntity],
                        enabledDrivers: ["mongodb"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("throws an error because there is no object id defined", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var repo, e_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    repo = connection.getRepository("UserWithoutObjectID");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, repo.insert({
                            name: "Dotan",
                        })];
                case 2:
                    _a.sent();
                    chai_1.expect(true).to.be.false;
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    chai_1.expect(e_1.message).to.eq("Cannot read property 'createValueMap' of undefined");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); })); });
    it("should create entities without throwing an error when objectId is defined", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var repo, result, insertedId;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    repo = connection.getRepository("User");
                    return [4 /*yield*/, repo.insert({
                            name: "Dotan",
                        })];
                case 1:
                    result = _a.sent();
                    insertedId = result.identifiers[0];
                    chai_1.expect(insertedId).not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1510.js.map