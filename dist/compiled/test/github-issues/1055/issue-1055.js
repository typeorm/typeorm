"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Parent_1 = require("./entity/Parent");
var Child_1 = require("./entity/Child");
var chai_1 = require("chai");
var PromiseUtils_1 = require("../../../src/util/PromiseUtils");
describe("github issues > #1055 ind with relations not working, correct syntax causes type error", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"] // only one driver is enabled because this example uses lazy relations
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should be able to find by object reference", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var manager, parent, loadedParent, child, foundChild;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = connection.manager;
                    parent = new Parent_1.Parent();
                    parent.name = "Parent";
                    return [4 /*yield*/, manager.save(parent)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, manager.findOne(Parent_1.Parent, 1)];
                case 2:
                    loadedParent = _a.sent();
                    chai_1.expect(loadedParent).not.to.be.undefined;
                    if (!loadedParent)
                        return [2 /*return*/];
                    child = connection.manager.create(Child_1.Child, {
                        name: "Child",
                        parent: loadedParent
                    });
                    return [4 /*yield*/, manager.save(child)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, manager.findOne(Child_1.Child, { parent: loadedParent })];
                case 4:
                    foundChild = _a.sent();
                    chai_1.expect(foundChild).not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be able to lookup from promise as well", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var manager, parent, loadedParent, child, foundChild;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = connection.manager;
                    parent = new Parent_1.Parent();
                    parent.name = "Parent";
                    return [4 /*yield*/, manager.save(parent)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, manager.findOne(Parent_1.Parent, 1)];
                case 2:
                    loadedParent = _a.sent();
                    chai_1.expect(loadedParent).not.to.be.undefined;
                    if (!loadedParent)
                        return [2 /*return*/];
                    child = new Child_1.Child();
                    child.name = "Child";
                    child.parent = Promise.resolve(loadedParent);
                    return [4 /*yield*/, manager.save(child)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, manager.findOne(Child_1.Child, { parent: PromiseUtils_1.PromiseUtils.create(loadedParent) })];
                case 4:
                    foundChild = _a.sent();
                    chai_1.expect(foundChild).not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should not have type errors with the primary key type", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var manager, parent, loadedParent, child, foundChild;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = connection.manager;
                    parent = new Parent_1.Parent();
                    parent.name = "Parent";
                    return [4 /*yield*/, manager.save(parent)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, manager.findOne(Parent_1.Parent, 1)];
                case 2:
                    loadedParent = _a.sent();
                    chai_1.expect(loadedParent).not.to.be.undefined;
                    if (!loadedParent)
                        return [2 /*return*/];
                    child = new Child_1.Child();
                    child.name = "Child";
                    child.parent = Promise.resolve(loadedParent);
                    return [4 /*yield*/, manager.save(child)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, manager.findOne(Child_1.Child, { parent: loadedParent.id })];
                case 4:
                    foundChild = _a.sent();
                    chai_1.expect(foundChild).not.to.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1055.js.map