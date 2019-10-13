"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Car_1 = require("./entity/Car");
describe("github issues > #521 Attributes in UPDATE in QB arent getting replaced", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should replace parameters", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var qb, _a, query, parameters;
        return tslib_1.__generator(this, function (_b) {
            qb = connection.getRepository(Car_1.Car).createQueryBuilder("car");
            _a = tslib_1.__read(qb
                .update({
                name: "Honda",
            })
                .where("name = :name", {
                name: "Toyota",
            })
                .getQueryAndParameters(), 2), query = _a[0], parameters = _a[1];
            query.should.not.be.undefined;
            query.should.not.be.eql("");
            return [2 /*return*/, parameters.length.should.eql(2)];
        });
    }); })); });
});
//# sourceMappingURL=issue-521.js.map