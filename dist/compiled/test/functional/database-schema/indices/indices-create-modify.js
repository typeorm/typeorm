"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var CockroachDriver_1 = require("../../../../src/driver/cockroachdb/CockroachDriver");
var test_utils_1 = require("../../../utils/test-utils");
var chai_1 = require("chai");
var IndexMetadata_1 = require("../../../../src/metadata/IndexMetadata");
var Person_1 = require("./entity/Person");
describe("database schema > indices > reading index from entity and updating database", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should create a non unique index with 2 columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("person")];
                case 1:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 2:
                    _a.sent();
                    chai_1.expect(table.indices.length).to.be.equal(1);
                    chai_1.expect(table.indices[0].name).to.be.equal("IDX_TEST");
                    chai_1.expect(table.indices[0].isUnique).to.be.false;
                    chai_1.expect(table.indices[0].columnNames.length).to.be.equal(2);
                    chai_1.expect(table.indices[0].columnNames).to.deep.include.members(["firstname", "lastname"]);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should update the index to be unique", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var entityMetadata, indexMetadata, queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    entityMetadata = connection.entityMetadatas.find(function (x) { return x.name === "Person"; });
                    indexMetadata = entityMetadata.indices.find(function (x) { return x.name === "IDX_TEST"; });
                    indexMetadata.isUnique = true;
                    return [4 /*yield*/, connection.synchronize(false)];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("person")];
                case 2:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    // CockroachDB stores unique indices as UNIQUE constraints
                    if (connection.driver instanceof CockroachDriver_1.CockroachDriver) {
                        chai_1.expect(table.uniques.length).to.be.equal(1);
                        chai_1.expect(table.uniques[0].name).to.be.equal("IDX_TEST");
                        chai_1.expect(table.uniques[0].columnNames.length).to.be.equal(2);
                        chai_1.expect(table.uniques[0].columnNames).to.deep.include.members(["firstname", "firstname"]);
                    }
                    else {
                        chai_1.expect(table.indices.length).to.be.equal(1);
                        chai_1.expect(table.indices[0].name).to.be.equal("IDX_TEST");
                        chai_1.expect(table.indices[0].isUnique).to.be.true;
                        chai_1.expect(table.indices[0].columnNames.length).to.be.equal(2);
                        chai_1.expect(table.indices[0].columnNames).to.deep.include.members(["firstname", "firstname"]);
                    }
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should update the index swaping the 2 columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var entityMetadata, queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    entityMetadata = connection.entityMetadatas.find(function (x) { return x.name === "Person"; });
                    entityMetadata.indices = [new IndexMetadata_1.IndexMetadata({
                            entityMetadata: entityMetadata,
                            args: {
                                target: Person_1.Person,
                                name: "IDX_TEST",
                                columns: ["lastname", "firstname"],
                                unique: false,
                                synchronize: true
                            }
                        })];
                    entityMetadata.indices.forEach(function (index) { return index.build(connection.namingStrategy); });
                    return [4 /*yield*/, connection.synchronize(false)];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("person")];
                case 2:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    chai_1.expect(table.indices.length).to.be.equal(1);
                    chai_1.expect(table.indices[0].name).to.be.equal("IDX_TEST");
                    chai_1.expect(table.indices[0].isUnique).to.be.false;
                    chai_1.expect(table.indices[0].columnNames.length).to.be.equal(2);
                    chai_1.expect(table.indices[0].columnNames).to.deep.include.members(["firstname", "lastname"]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=indices-create-modify.js.map