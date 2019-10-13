"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
var Bar_1 = require("./entity/Bar");
var Foo_1 = require("./entity/Foo");
describe("github issues > #2251 - Unexpected behavior when passing duplicate entities to repository.save()", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true
                    })];
                case 1: return [2 /*return*/, (connections = _a.sent())];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should update all entities", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var repo, bars;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        repo = connection.getRepository(Bar_1.Bar);
                        return [4 /*yield*/, repo.save([{ description: "test1" }, { description: "test2" }])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, repo.find()];
                    case 2:
                        bars = _a.sent();
                        return [4 /*yield*/, repo.save([
                                { id: 1, description: "test1a" },
                                { id: 2, description: "test2a" },
                                { id: 1, description: "test1a" },
                                { id: 2, description: "test2a" }
                            ])];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, repo.find()];
                    case 4:
                        bars = _a.sent();
                        chai_1.expect(bars.length).to.equal(2);
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should handle cascade updates", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var barRepo, fooRepo, bars, bar;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        barRepo = connection.getRepository(Bar_1.Bar);
                        fooRepo = connection.getRepository(Foo_1.Foo);
                        return [4 /*yield*/, fooRepo.save({
                                bars: [{ description: "test2a" }, { description: "test2b" }]
                            })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, fooRepo.save({
                                id: 1,
                                bars: [
                                    { id: 1, description: "test2a-1" },
                                    { description: "test2c" },
                                    { id: 1, description: "test2a-2" }
                                ]
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, barRepo.find()];
                    case 3:
                        bars = _a.sent();
                        // We saved two bars originally. The above save should update the description of one,
                        // remove the reference of another and insert a 3rd.
                        chai_1.expect(bars.length).to.equal(3);
                        return [4 /*yield*/, barRepo.findOne(1)];
                    case 4:
                        bar = _a.sent();
                        chai_1.expect(bar).not.to.be.undefined;
                        // Did not observe the same behavior with unwanted inserts. Current behavior is
                        // that the first duplicate goes through and the rest are ignored.
                        chai_1.expect(bar.description).to.equal("test2a-1");
                        return [2 /*return*/];
                }
            });
        }); }));
    });
});
//# sourceMappingURL=issue-2251.js.map