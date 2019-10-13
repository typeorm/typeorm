"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var dummy_1 = require("./entity/dummy");
var dummy2_1 = require("./entity/dummy2");
describe("github issues > #2364 should generate id value if @Column generated:true is set", function () {
    var connections;
    it("should generate id value", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [4 /*yield*/, test_utils_1.reloadTestingDatabases(connections)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var repository1, repository2, dummyObj1, dummyObj2;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        repository1 = connection.getRepository(dummy_1.Dummy);
                                        repository2 = connection.getRepository(dummy2_1.Dummy2);
                                        dummyObj1 = new dummy_1.Dummy();
                                        dummyObj2 = new dummy2_1.Dummy2();
                                        return [4 /*yield*/, repository1.insert(dummyObj1)];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, repository2.insert(dummyObj2)];
                                    case 2:
                                        _a.sent();
                                        chai_1.expect(dummyObj1.id).to.not.be.eq(0);
                                        chai_1.expect(dummyObj2.id).to.not.be.eq(0);
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, test_utils_1.closeTestingConnections(connections)];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=issue-2364.js.map