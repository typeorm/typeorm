"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../utils/test-utils");
var MysqlDriver_1 = require("../../../src/driver/mysql/MysqlDriver");
describe("schema builder > create table", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly create tables with all dependencies", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, postTable, teacherTable, studentTable, facultyTable, idColumn, versionColumn, nameColumn;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    postTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("teacher")];
                case 2:
                    teacherTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("student")];
                case 3:
                    studentTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("faculty")];
                case 4:
                    facultyTable = _a.sent();
                    chai_1.expect(postTable).to.be.undefined;
                    chai_1.expect(teacherTable).to.be.undefined;
                    chai_1.expect(studentTable).to.be.undefined;
                    chai_1.expect(facultyTable).to.be.undefined;
                    return [4 /*yield*/, connection.synchronize()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 6:
                    postTable = _a.sent();
                    idColumn = postTable.findColumnByName("id");
                    versionColumn = postTable.findColumnByName("version");
                    nameColumn = postTable.findColumnByName("name");
                    postTable.should.exist;
                    if (connection.driver instanceof MysqlDriver_1.MysqlDriver) {
                        postTable.indices.length.should.be.equal(2);
                    }
                    else {
                        postTable.uniques.length.should.be.equal(2);
                        postTable.checks.length.should.be.equal(1);
                    }
                    idColumn.isPrimary.should.be.true;
                    versionColumn.isUnique.should.be.true;
                    nameColumn.default.should.be.exist;
                    return [4 /*yield*/, queryRunner.getTable("teacher")];
                case 7:
                    teacherTable = _a.sent();
                    teacherTable.should.exist;
                    return [4 /*yield*/, queryRunner.getTable("student")];
                case 8:
                    studentTable = _a.sent();
                    studentTable.should.exist;
                    studentTable.foreignKeys.length.should.be.equal(2);
                    // CockroachDB also stores indices for relation columns
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver) {
                        studentTable.indices.length.should.be.equal(3);
                    }
                    else {
                        studentTable.indices.length.should.be.equal(1);
                    }
                    return [4 /*yield*/, queryRunner.getTable("faculty")];
                case 9:
                    facultyTable = _a.sent();
                    facultyTable.should.exist;
                    return [4 /*yield*/, queryRunner.release()];
                case 10:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=create-table.js.map