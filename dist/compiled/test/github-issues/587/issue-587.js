"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
describe("github issues > #587 Ordering of fields in composite indexes defined using Index decorator", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    // this test only works for fields specified as string[]
    it("should preserve field ordering when fields are specified as string[]", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            connection.entityMetadatas.forEach(function (entityMetadata) {
                entityMetadata.indices.forEach(function (index) {
                    if (index.givenColumnNames && index.givenColumnNames instanceof Array) {
                        for (var i = 0; i < index.columns.length; i++) {
                            var givenColumn = index.givenColumnNames[i];
                            var actualColumn = index.columns[i];
                            actualColumn.propertyName.should.equal(givenColumn);
                        }
                    }
                });
            });
            return [2 /*return*/];
        });
    }); })); });
});
//# sourceMappingURL=issue-587.js.map