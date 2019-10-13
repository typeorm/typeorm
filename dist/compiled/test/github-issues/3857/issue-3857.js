"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Person_1 = require("./entity/Person");
var Men_1 = require("./entity/Men");
var Women_1 = require("./entity/Women");
describe("github issues > #3857 Schema inheritance when STI pattern is used", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        enabledDrivers: ["postgres", "mariadb", "mysql"],
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schema: "custom",
                        schemaCreate: true
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("Child classes should have same schema as parent", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var personMetadata, menMetadata, womenMetadata;
        return tslib_1.__generator(this, function (_a) {
            personMetadata = connection.getMetadata(Person_1.Person);
            menMetadata = connection.getMetadata(Men_1.Men);
            womenMetadata = connection.getMetadata(Women_1.Women);
            // @ts-ignore
            personMetadata.schema.should.be.eq("custom");
            // @ts-ignore
            menMetadata.schema.should.be.eq(personMetadata.schema);
            // @ts-ignore
            womenMetadata.schema.should.be.eq(personMetadata.schema);
            return [2 /*return*/];
        });
    }); })); });
});
//# sourceMappingURL=issue-3857.js.map