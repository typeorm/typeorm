"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var src_1 = require("../../../src");
var Teacher_1 = require("./entity/Teacher");
var Post_1 = require("./entity/Post");
var ExclusionMetadata_1 = require("../../../src/metadata/ExclusionMetadata");
var PostgresDriver_1 = require("../../../src/driver/postgres/PostgresDriver");
describe("schema builder > change exclusion constraint", function () {
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
    it("should correctly add new exclusion constraint", function () { return src_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var teacherMetadata, exclusionMetadata, queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Only PostgreSQL supports exclusion constraints.
                    if (!(connection.driver instanceof PostgresDriver_1.PostgresDriver))
                        return [2 /*return*/];
                    teacherMetadata = connection.getMetadata(Teacher_1.Teacher);
                    exclusionMetadata = new ExclusionMetadata_1.ExclusionMetadata({
                        entityMetadata: teacherMetadata,
                        args: {
                            target: Teacher_1.Teacher,
                            expression: "USING gist (\"name\" WITH =)"
                        }
                    });
                    exclusionMetadata.build(connection.namingStrategy);
                    teacherMetadata.exclusions.push(exclusionMetadata);
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
                    table.exclusions.length.should.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); }); });
    it("should correctly change exclusion", function () { return src_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postMetadata, queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Only PostgreSQL supports exclusion constraints.
                    if (!(connection.driver instanceof PostgresDriver_1.PostgresDriver))
                        return [2 /*return*/];
                    postMetadata = connection.getMetadata(Post_1.Post);
                    postMetadata.exclusions[0].expression = "USING gist (\"tag\" WITH =)";
                    postMetadata.exclusions[0].build(connection.namingStrategy);
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
                    table.exclusions[0].expression.indexOf("tag").should.be.not.equal(-1);
                    return [2 /*return*/];
            }
        });
    }); }); });
    it("should correctly drop removed exclusion", function () { return src_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postMetadata, queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Only PostgreSQL supports exclusion constraints.
                    if (!(connection.driver instanceof PostgresDriver_1.PostgresDriver))
                        return [2 /*return*/];
                    postMetadata = connection.getMetadata(Post_1.Post);
                    postMetadata.exclusions = [];
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
                    table.exclusions.length.should.be.equal(0);
                    return [2 /*return*/];
            }
        });
    }); }); });
});
//# sourceMappingURL=change-exclusion-constraint.js.map