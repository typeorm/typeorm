"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("github issues > #1733 Postgresql driver does not detect/support varying without length specified", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly synchronize schema when varchar column length is not specified", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, postMetadata, column1, column2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    table.findColumnByName("name").length.should.be.empty;
                    table.findColumnByName("name2").length.should.be.equal("255");
                    postMetadata = connection.getMetadata(Post_1.Post);
                    column1 = postMetadata.findColumnWithPropertyName("name");
                    column2 = postMetadata.findColumnWithPropertyName("name2");
                    column1.length = "500";
                    column2.length = "";
                    return [4 /*yield*/, connection.synchronize()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 3:
                    table = _a.sent();
                    table.findColumnByName("name").length.should.be.equal("500");
                    table.findColumnByName("name2").length.should.be.empty;
                    column1.length = "";
                    column2.length = "255";
                    return [4 /*yield*/, connection.synchronize()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 5:
                    table = _a.sent();
                    table.findColumnByName("name").length.should.be.empty;
                    table.findColumnByName("name2").length.should.be.equal("255");
                    return [4 /*yield*/, queryRunner.release()];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1733.js.map