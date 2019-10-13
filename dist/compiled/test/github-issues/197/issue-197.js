"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var person_1 = require("./entity/person");
describe("github issues > #197 Fails to drop indexes when removing fields", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: false,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("it should drop the column and the referenced index", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var entityMetadata, idx;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    entityMetadata = connection.getMetadata(person_1.Person);
                    idx = entityMetadata.columns.findIndex(function (x) { return x.databaseName === "firstname"; });
                    entityMetadata.columns.splice(idx, 1);
                    entityMetadata.indices = []; // clear the referenced index from metadata too
                    return [4 /*yield*/, connection.synchronize(false)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-197.js.map