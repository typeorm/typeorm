"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
describe("query runner > drop table", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly drop table without relations and revert drop", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    table.should.exist;
                    return [4 /*yield*/, queryRunner.dropTable("post")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 3:
                    table = _a.sent();
                    chai_1.expect(table).to.be.undefined;
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 5:
                    table = _a.sent();
                    table.should.exist;
                    return [4 /*yield*/, queryRunner.release()];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should correctly drop table with relations and revert drop", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, studentTable, teacherTable, facultyTable;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("student")];
                case 1:
                    studentTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("teacher")];
                case 2:
                    teacherTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("faculty")];
                case 3:
                    facultyTable = _a.sent();
                    studentTable.should.exist;
                    teacherTable.should.exist;
                    facultyTable.should.exist;
                    return [4 /*yield*/, queryRunner.dropTable(studentTable)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.dropTable(teacherTable)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.dropTable(facultyTable)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("student")];
                case 7:
                    studentTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("teacher")];
                case 8:
                    teacherTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("faculty")];
                case 9:
                    facultyTable = _a.sent();
                    chai_1.expect(studentTable).to.be.undefined;
                    chai_1.expect(teacherTable).to.be.undefined;
                    chai_1.expect(facultyTable).to.be.undefined;
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("student")];
                case 11:
                    studentTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("teacher")];
                case 12:
                    teacherTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("faculty")];
                case 13:
                    facultyTable = _a.sent();
                    studentTable.should.exist;
                    teacherTable.should.exist;
                    facultyTable.should.exist;
                    return [4 /*yield*/, queryRunner.release()];
                case 14:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=drop-table.js.map