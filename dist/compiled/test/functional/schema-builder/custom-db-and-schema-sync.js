"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var PostgresDriver_1 = require("../../../src/driver/postgres/PostgresDriver");
var SqlServerDriver_1 = require("../../../src/driver/sqlserver/SqlServerDriver");
var MysqlDriver_1 = require("../../../src/driver/mysql/MysqlDriver");
var ForeignKeyMetadata_1 = require("../../../src/metadata/ForeignKeyMetadata");
describe("schema builder > custom-db-and-schema-sync", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql", "mssql", "postgres"],
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
    it("should correctly sync tables with custom schema and database", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, photoMetadata, albumMetadata, albumTable, photoTable, columns, referencedColumns, fkMetadata;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    photoMetadata = connection.getMetadata("photo");
                    albumMetadata = connection.getMetadata("album");
                    // create tables
                    photoMetadata.synchronize = true;
                    albumMetadata.synchronize = true;
                    if (!(connection.driver instanceof SqlServerDriver_1.SqlServerDriver)) return [3 /*break*/, 4];
                    photoMetadata.database = "secondDB";
                    photoMetadata.schema = "photo-schema";
                    photoMetadata.tablePath = "secondDB.photo-schema.photo";
                    photoMetadata.schemaPath = "secondDB.photo-schema";
                    albumMetadata.database = "secondDB";
                    albumMetadata.schema = "album-schema";
                    albumMetadata.tablePath = "secondDB.album-schema.album";
                    albumMetadata.schemaPath = "secondDB.album-schema";
                    return [4 /*yield*/, queryRunner.createDatabase(photoMetadata.database, true)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.createSchema(photoMetadata.schemaPath, true)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.createSchema(albumMetadata.schemaPath, true)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 4:
                    if (!(connection.driver instanceof PostgresDriver_1.PostgresDriver)) return [3 /*break*/, 7];
                    photoMetadata.schema = "photo-schema";
                    photoMetadata.tablePath = "photo-schema.photo";
                    photoMetadata.schemaPath = "photo-schema";
                    albumMetadata.schema = "album-schema";
                    albumMetadata.tablePath = "album-schema.album";
                    albumMetadata.schemaPath = "album-schema";
                    return [4 /*yield*/, queryRunner.createSchema(photoMetadata.schemaPath, true)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.createSchema(albumMetadata.schemaPath, true)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 7:
                    if (!(connection.driver instanceof MysqlDriver_1.MysqlDriver)) return [3 /*break*/, 9];
                    photoMetadata.database = "secondDB";
                    photoMetadata.tablePath = "secondDB.photo";
                    albumMetadata.database = "secondDB";
                    albumMetadata.tablePath = "secondDB.album";
                    return [4 /*yield*/, queryRunner.createDatabase(photoMetadata.database, true)];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9: return [4 /*yield*/, connection.synchronize()];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable(albumMetadata.tablePath)];
                case 11:
                    albumTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable(photoMetadata.tablePath)];
                case 12:
                    photoTable = _a.sent();
                    albumTable.should.be.exist;
                    photoTable.should.be.exist;
                    columns = photoMetadata.columns.filter(function (column) { return column.propertyName === "albumId"; });
                    referencedColumns = albumMetadata.columns.filter(function (column) { return column.propertyName === "id"; });
                    fkMetadata = new ForeignKeyMetadata_1.ForeignKeyMetadata({
                        entityMetadata: photoMetadata,
                        referencedEntityMetadata: albumMetadata,
                        columns: columns,
                        referencedColumns: referencedColumns,
                        namingStrategy: connection.namingStrategy
                    });
                    photoMetadata.foreignKeys.push(fkMetadata);
                    return [4 /*yield*/, connection.synchronize()];
                case 13:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable(photoMetadata.tablePath)];
                case 14:
                    photoTable = _a.sent();
                    photoTable.foreignKeys.length.should.be.equal(1);
                    // drop foreign key
                    photoMetadata.foreignKeys = [];
                    return [4 /*yield*/, connection.synchronize()];
                case 15:
                    _a.sent();
                    // drop tables manually, because they will not synchronize automatically
                    return [4 /*yield*/, queryRunner.dropTable(photoMetadata.tablePath, true, false)];
                case 16:
                    // drop tables manually, because they will not synchronize automatically
                    _a.sent();
                    return [4 /*yield*/, queryRunner.dropTable(albumMetadata.tablePath, true, false)];
                case 17:
                    _a.sent();
                    // drop created database
                    return [4 /*yield*/, queryRunner.dropDatabase("secondDB", true)];
                case 18:
                    // drop created database
                    _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 19:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=custom-db-and-schema-sync.js.map