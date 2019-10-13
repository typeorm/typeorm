"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var ConcreteEntity_1 = require("./entity/ConcreteEntity");
describe("github issues > #1369 EntitySubscriber not firing events on abstract class entity", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should fire the given event for an abstract entity", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var entity, foundEntity, assertObject;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    entity = new ConcreteEntity_1.ConcreteEntity();
                    entity.firstname = "Michael";
                    entity.lastname = "Scott";
                    entity.position = "Regional Manager";
                    return [4 /*yield*/, connection.manager.save(entity)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(ConcreteEntity_1.ConcreteEntity, 1)];
                case 2:
                    foundEntity = _a.sent();
                    chai_1.expect(foundEntity).to.not.be.undefined;
                    assertObject = Object.assign({}, foundEntity);
                    assertObject.should.be.eql({
                        id: 1,
                        firstname: "Michael",
                        lastname: "Scott",
                        fullname: "Michael Scott",
                        position: "Regional Manager"
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1369.js.map