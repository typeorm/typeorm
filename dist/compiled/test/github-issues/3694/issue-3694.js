"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var chai_1 = require("chai");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var FruitEnum_1 = require("./enum/FruitEnum");
describe("github issues > #3694 Sync enums on schema sync", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql", "postgres"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should change schema when enum definition changes", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var fruitEnum, metadata, fruitColumn, queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fruitEnum = FruitEnum_1.FruitEnum;
                    fruitEnum.Banana = "BANANA";
                    Object.assign(fruitEnum, { Cherry: "cherry" });
                    metadata = connection.getMetadata(Post_1.Post);
                    fruitColumn = metadata.columns.find(function (column) { return column.propertyName === "fruit"; });
                    fruitColumn.enum = Object.keys(fruitEnum).map(function (key) { return fruitEnum[key]; });
                    return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 2:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    chai_1.expect(table.findColumnByName("fruit").enum).to.deep.equal(["apple", "pineapple", "BANANA", "cherry"]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-3694.js.map