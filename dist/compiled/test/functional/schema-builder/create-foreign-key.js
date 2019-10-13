"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var UniqueMetadata_1 = require("../../../src/metadata/UniqueMetadata");
var test_utils_1 = require("../../utils/test-utils");
var ForeignKeyMetadata_1 = require("../../../src/metadata/ForeignKeyMetadata");
describe("schema builder > create foreign key", function () {
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
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly create foreign key", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var categoryMetadata, postMetadata, columns, referencedColumns, fkMetadata, uniqueConstraint, queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    categoryMetadata = connection.getMetadata("category");
                    postMetadata = connection.getMetadata("post");
                    columns = categoryMetadata.columns.filter(function (column) { return ["postText", "postTag"].indexOf(column.propertyName) !== -1; });
                    referencedColumns = postMetadata.columns.filter(function (column) { return ["text", "tag"].indexOf(column.propertyName) !== -1; });
                    fkMetadata = new ForeignKeyMetadata_1.ForeignKeyMetadata({
                        entityMetadata: categoryMetadata,
                        referencedEntityMetadata: postMetadata,
                        columns: columns,
                        referencedColumns: referencedColumns,
                        namingStrategy: connection.namingStrategy
                    });
                    categoryMetadata.foreignKeys.push(fkMetadata);
                    // CockroachDB requires unique constraint for foreign key referenced columns
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver) {
                        uniqueConstraint = new UniqueMetadata_1.UniqueMetadata({
                            entityMetadata: categoryMetadata,
                            columns: fkMetadata.columns,
                            args: {
                                name: connection.namingStrategy.relationConstraintName(categoryMetadata.tablePath, fkMetadata.columns.map(function (c) { return c.databaseName; })),
                                target: categoryMetadata.target,
                            }
                        });
                        categoryMetadata.uniques.push(uniqueConstraint);
                    }
                    return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("category")];
                case 2:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    table.foreignKeys.length.should.be.equal(1);
                    table.indices.length.should.be.equal(0);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=create-foreign-key.js.map