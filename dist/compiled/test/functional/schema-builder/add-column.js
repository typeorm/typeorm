"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../utils/test-utils");
var ColumnMetadata_1 = require("../../../src/metadata/ColumnMetadata");
var Post_1 = require("./entity/Post");
describe("schema builder > add column", function () {
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
    it("should correctly add column", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _a, postMetadata, columnMetadata1, columnMetadata2, queryRunner, table, column1, column2;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    postMetadata = connection.getMetadata("post");
                    columnMetadata1 = new ColumnMetadata_1.ColumnMetadata({
                        connection: connection,
                        entityMetadata: postMetadata,
                        args: {
                            target: Post_1.Post,
                            propertyName: "secondId",
                            mode: "regular",
                            options: {
                                type: "int",
                                name: "secondId",
                                primary: !(connection.driver instanceof CockroachDriver_1.CockroachDriver),
                                nullable: false
                            }
                        }
                    });
                    columnMetadata1.build(connection);
                    columnMetadata2 = new ColumnMetadata_1.ColumnMetadata({
                        connection: connection,
                        entityMetadata: postMetadata,
                        args: {
                            target: Post_1.Post,
                            propertyName: "description",
                            mode: "regular",
                            options: {
                                type: "varchar",
                                name: "description",
                                length: 100
                            }
                        }
                    });
                    columnMetadata2.build(connection);
                    (_a = postMetadata.columns).push.apply(_a, tslib_1.__spread([columnMetadata1, columnMetadata2]));
                    return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _b.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 2:
                    table = _b.sent();
                    column1 = table.findColumnByName("secondId");
                    column1.should.be.exist;
                    column1.isNullable.should.be.false;
                    if (!(connection.driver instanceof CockroachDriver_1.CockroachDriver))
                        column1.isPrimary.should.be.true;
                    column2 = table.findColumnByName("description");
                    column2.should.be.exist;
                    column2.length.should.be.equal("100");
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=add-column.js.map