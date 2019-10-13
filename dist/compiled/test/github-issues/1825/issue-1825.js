"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var thing_1 = require("./entity/thing");
var chai_1 = require("chai");
describe("github issues > #1825 Invalid field values being loaded with long camelCased embedded field names.", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql", "postgres", "mariadb"]
                    })];
                case 1: return [2 /*return*/, (connections = _a.sent())];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should load valid values in embedded with long field names", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var thingRepository, thing, embeddedThing, loadedThing;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    thingRepository = connection.getRepository(thing_1.Thing);
                    thing = new thing_1.Thing();
                    embeddedThing = new thing_1.EmbeddedInThing();
                    embeddedThing.someSeriouslyLongFieldNameFirst = 1;
                    embeddedThing.someSeriouslyLongFieldNameSecond = 2;
                    thing.embeddedThing = embeddedThing;
                    return [4 /*yield*/, thingRepository.save(thing)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, thingRepository.findOne(thing.id)];
                case 2:
                    loadedThing = _a.sent();
                    chai_1.expect(loadedThing).to.eql(thing);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1825.js.map