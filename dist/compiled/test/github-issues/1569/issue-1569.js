"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
var Item_1 = require("./entity/Item");
describe("github issue > #1569 updateById generates wrong SQL with arrays inside embeddeds", function () {
    var connections = [];
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
    it("should properly updateById arrays inside embeddeds", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var item, embedded, loadedItem;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    item = new Item_1.Item();
                    item.someText = "some";
                    embedded = new Item_1.EmbeddedItem();
                    embedded.arrayInsideEmbedded = [1, 2, 3];
                    item.embedded = embedded;
                    return [4 /*yield*/, connection.getRepository(Item_1.Item).save(item)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Item_1.Item).update(item.id, {
                            someText: "some2",
                            embedded: {
                                arrayInsideEmbedded: [1, 2],
                            },
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Item_1.Item).findOne(item.id)];
                case 3:
                    loadedItem = _a.sent();
                    chai_1.expect(loadedItem.embedded.arrayInsideEmbedded).to.eql([1, 2]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1569.js.map