"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var src_1 = require("../../../src");
var Teacher_1 = require("./entity/Teacher");
var UniqueMetadata_1 = require("../../../src/metadata/UniqueMetadata");
var MysqlDriver_1 = require("../../../src/driver/mysql/MysqlDriver");
var Post_1 = require("./entity/Post");
var AbstractSqliteDriver_1 = require("../../../src/driver/sqlite-abstract/AbstractSqliteDriver");
var IndexMetadata_1 = require("../../../src/metadata/IndexMetadata");
describe("schema builder > change unique constraint", function () {
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
    it("should correctly add new unique constraint", function () { return src_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var teacherMetadata, nameColumn, uniqueIndexMetadata, uniqueMetadata, queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    teacherMetadata = connection.getMetadata(Teacher_1.Teacher);
                    nameColumn = teacherMetadata.findColumnWithPropertyName("name");
                    uniqueIndexMetadata = undefined;
                    uniqueMetadata = undefined;
                    // Mysql stores unique constraints as unique indices.
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        uniqueIndexMetadata = new IndexMetadata_1.IndexMetadata({
                            entityMetadata: teacherMetadata,
                            columns: [nameColumn],
                            args: {
                                target: Teacher_1.Teacher,
                                unique: true,
                                synchronize: true
                            }
                        });
                        uniqueIndexMetadata.build(connection.namingStrategy);
                        teacherMetadata.indices.push(uniqueIndexMetadata);
                    }
                    else {
                        uniqueMetadata = new UniqueMetadata_1.UniqueMetadata({
                            entityMetadata: teacherMetadata,
                            columns: [nameColumn],
                            args: {
                                target: Teacher_1.Teacher
                            }
                        });
                        uniqueMetadata.build(connection.namingStrategy);
                        teacherMetadata.uniques.push(uniqueMetadata);
                    }
                    return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("teacher")];
                case 2:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        table.indices.length.should.be.equal(1);
                        table.indices[0].isUnique.should.be.true;
                        // revert changes
                        teacherMetadata.indices.splice(teacherMetadata.indices.indexOf(uniqueIndexMetadata), 1);
                    }
                    else {
                        table.uniques.length.should.be.equal(1);
                        // revert changes
                        teacherMetadata.uniques.splice(teacherMetadata.uniques.indexOf(uniqueMetadata), 1);
                    }
                    return [2 /*return*/];
            }
        });
    }); }); });
    it("should correctly change unique constraint", function () { return src_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postMetadata, uniqueIndexMetadata, uniqueMetadata, queryRunner, table, tableIndex, uniqueIndexMetadata, tableUnique, uniqueMetadata;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Sqlite does not store unique constraint name
                    if (connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver)
                        return [2 /*return*/];
                    postMetadata = connection.getMetadata(Post_1.Post);
                    // Mysql stores unique constraints as unique indices.
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        uniqueIndexMetadata = postMetadata.indices.find(function (i) { return i.columns.length === 2 && i.isUnique === true; });
                        uniqueIndexMetadata.name = "changed_unique";
                    }
                    else {
                        uniqueMetadata = postMetadata.uniques.find(function (uq) { return uq.columns.length === 2; });
                        uniqueMetadata.name = "changed_unique";
                    }
                    return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 2:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        tableIndex = table.indices.find(function (index) { return index.columnNames.length === 2 && index.isUnique === true; });
                        tableIndex.name.should.be.equal("changed_unique");
                        uniqueIndexMetadata = postMetadata.indices.find(function (i) { return i.name === "changed_unique"; });
                        uniqueIndexMetadata.name = connection.namingStrategy.indexName(table, uniqueIndexMetadata.columns.map(function (c) { return c.databaseName; }));
                    }
                    else {
                        tableUnique = table.uniques.find(function (unique) { return unique.columnNames.length === 2; });
                        tableUnique.name.should.be.equal("changed_unique");
                        uniqueMetadata = postMetadata.uniques.find(function (i) { return i.name === "changed_unique"; });
                        uniqueMetadata.name = connection.namingStrategy.uniqueConstraintName(table, uniqueMetadata.columns.map(function (c) { return c.databaseName; }));
                    }
                    return [2 /*return*/];
            }
        });
    }); }); });
    it("should correctly drop removed unique constraint", function () { return src_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postMetadata, index, unique, queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postMetadata = connection.getMetadata(Post_1.Post);
                    // Mysql stores unique constraints as unique indices.
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        index = postMetadata.indices.find(function (i) { return i.columns.length === 2 && i.isUnique === true; });
                        postMetadata.indices.splice(postMetadata.indices.indexOf(index), 1);
                    }
                    else {
                        unique = postMetadata.uniques.find(function (u) { return u.columns.length === 2; });
                        postMetadata.uniques.splice(postMetadata.uniques.indexOf(unique), 1);
                    }
                    return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 2:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        table.indices.length.should.be.equal(1);
                    }
                    else {
                        table.uniques.length.should.be.equal(1);
                    }
                    return [2 /*return*/];
            }
        });
    }); }); });
});
//# sourceMappingURL=change-unique-constraint.js.map