"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var CockroachDriver_1 = require("../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
describe("schema builder > drop column", function () {
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
    it("should correctly drop column", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var studentMetadata, removedColumns, removedForeignKey, queryRunner, studentTable;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    studentMetadata = connection.getMetadata("student");
                    removedColumns = studentMetadata.columns.filter(function (column) { return ["name", "faculty"].indexOf(column.propertyName) !== -1; });
                    removedColumns.forEach(function (column) {
                        studentMetadata.columns.splice(studentMetadata.columns.indexOf(column), 1);
                    });
                    // in real sync indices removes automatically
                    studentMetadata.indices = studentMetadata.indices.filter(function (index) {
                        return !index.columns.find(function (column) { return ["name", "facultyId"].indexOf(column.databaseName) !== -1; });
                    });
                    removedForeignKey = studentMetadata.foreignKeys.find(function (fk) {
                        return !!fk.columns.find(function (column) { return column.propertyName === "faculty"; });
                    });
                    studentMetadata.foreignKeys.splice(studentMetadata.foreignKeys.indexOf(removedForeignKey), 1);
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
                    chai_1.expect(studentTable.findColumnByName("name")).to.be.undefined;
                    chai_1.expect(studentTable.findColumnByName("faculty")).to.be.undefined;
                    // CockroachDB creates indices for foreign keys
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver) {
                        studentTable.indices.length.should.be.equal(1);
                    }
                    else {
                        studentTable.indices.length.should.be.equal(0);
                    }
                    studentTable.foreignKeys.length.should.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=drop-column.js.map