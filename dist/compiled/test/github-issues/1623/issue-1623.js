"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var ColumnMetadata_1 = require("../../../src/metadata/ColumnMetadata");
var User_1 = require("./entity/User");
describe("github issues > #1623 NOT NULL constraint failed after a new column is added (SQLite)", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
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
    it("should correctly add new column", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var userMetadata, columnMetadata, queryRunner, table, column1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    userMetadata = connection.getMetadata(User_1.User);
                    columnMetadata = new ColumnMetadata_1.ColumnMetadata({
                        connection: connection,
                        entityMetadata: userMetadata,
                        args: {
                            target: User_1.User,
                            propertyName: "userName",
                            mode: "regular",
                            options: {
                                type: "varchar",
                                name: "userName"
                            }
                        }
                    });
                    columnMetadata.build(connection);
                    userMetadata.columns.push(columnMetadata);
                    return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("user")];
                case 2:
                    table = _a.sent();
                    column1 = table.findColumnByName("userName");
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    column1.should.be.exist;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1623.js.map