"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../utils/test-utils");
var src_1 = require("../../../src");
var IndexMetadata_1 = require("../../../src/metadata/IndexMetadata");
var Teacher_1 = require("./entity/Teacher");
var Student_1 = require("./entity/Student");
var TableIndex_1 = require("../../../src/schema-builder/table/TableIndex");
var chai_1 = require("chai");
describe("schema builder > change index", function () {
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
    it("should correctly add new index", function () { return src_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var teacherMetadata, nameColumn, indexMetadata, queryRunner, teacherTable;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    teacherMetadata = connection.getMetadata(Teacher_1.Teacher);
                    nameColumn = teacherMetadata.findColumnWithPropertyName("name");
                    indexMetadata = new IndexMetadata_1.IndexMetadata({
                        entityMetadata: teacherMetadata,
                        columns: [nameColumn],
                        args: {
                            target: Teacher_1.Teacher,
                            synchronize: true
                        }
                    });
                    indexMetadata.build(connection.namingStrategy);
                    teacherMetadata.indices.push(indexMetadata);
                    return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("teacher")];
                case 2:
                    teacherTable = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    teacherTable.indices.length.should.be.equal(1);
                    // revert changes
                    teacherMetadata.indices.splice(teacherMetadata.indices.indexOf(indexMetadata), 1);
                    return [2 /*return*/];
            }
        });
    }); }); });
    it("should correctly change index", function () { return src_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var studentMetadata, queryRunner, studentTable, index;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    studentMetadata = connection.getMetadata(Student_1.Student);
                    studentMetadata.indices[0].name = "changed_index";
                    return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("student")];
                case 2:
                    studentTable = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    index = studentTable.indices.find(function (i) { return i.name === "changed_index"; });
                    chai_1.expect(index).not.be.undefined;
                    return [2 /*return*/];
            }
        });
    }); }); });
    it("should correctly drop removed index", function () { return src_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var studentMetadata, queryRunner, studentTable;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    studentMetadata = connection.getMetadata(Student_1.Student);
                    studentMetadata.indices.splice(0, 1);
                    return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("student")];
                case 2:
                    studentTable = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    // CockroachDB also stores indices for relation columns
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver) {
                        studentTable.indices.length.should.be.equal(2);
                    }
                    else {
                        studentTable.indices.length.should.be.equal(0);
                    }
                    return [2 /*return*/];
            }
        });
    }); }); });
    it("should ignore index synchronization when `synchronize` set to false", function () { return src_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, teacherTable, index;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("teacher")];
                case 1:
                    teacherTable = _a.sent();
                    teacherTable.indices.length.should.be.equal(0);
                    index = new TableIndex_1.TableIndex({ name: "ignored_index", columnNames: ["name"], isUnique: true });
                    return [4 /*yield*/, queryRunner.createIndex(teacherTable, index)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("teacher")];
                case 3:
                    teacherTable = _a.sent();
                    // CockroachDB stores unique indices as UNIQUE constraints
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver) {
                        teacherTable.indices.length.should.be.equal(0);
                        teacherTable.uniques.length.should.be.equal(1);
                        teacherTable.findColumnByName("name").isUnique.should.be.true;
                    }
                    else {
                        teacherTable.indices.length.should.be.equal(1);
                        teacherTable.indices[0].isUnique.should.be.true;
                    }
                    return [4 /*yield*/, connection.synchronize()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("teacher")];
                case 5:
                    teacherTable = _a.sent();
                    // CockroachDB stores unique indices as UNIQUE constraints
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver) {
                        teacherTable.indices.length.should.be.equal(0);
                        teacherTable.uniques.length.should.be.equal(0);
                        teacherTable.findColumnByName("name").isUnique.should.be.false;
                    }
                    else {
                        teacherTable.indices.length.should.be.equal(1);
                        teacherTable.indices[0].isUnique.should.be.true;
                    }
                    return [4 /*yield*/, queryRunner.release()];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }); });
});
//# sourceMappingURL=change-index.js.map