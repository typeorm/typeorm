"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var MysqlDriver_1 = require("../../../src/driver/mysql/MysqlDriver");
var test_utils_1 = require("../../utils/test-utils");
var src_1 = require("../../../src");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
describe("github issues > #3803 column option unique sqlite error", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [new src_1.EntitySchema(Post_1.PostSchema)],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should create unique constraints defined in EntitySchema", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 2:
                    _a.sent();
                    // MySQL stores unique constraints as unique indices
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        chai_1.expect(table.indices.length).to.be.equal(1);
                        chai_1.expect(table.indices[0].isUnique).to.be.true;
                        chai_1.expect(table.indices[0].columnNames[0]).to.be.equal("name");
                    }
                    else {
                        chai_1.expect(table.uniques.length).to.be.equal(1);
                        chai_1.expect(table.uniques[0].columnNames[0]).to.be.equal("name");
                    }
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-3803.js.map