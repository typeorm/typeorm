"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var src_1 = require("../../../src");
describe("github issues > #1997 enum type not working in postgres when defined in a custom schema", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var queryRunner;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = connection.createQueryRunner();
                        return [4 /*yield*/, queryRunner.dropSchema("schema", true, true)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.createSchema("schema")];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.release()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    afterEach(function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var queryRunner;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = connection.createQueryRunner();
                        return [4 /*yield*/, queryRunner.dropSchema("schema", true, true)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.release()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should create table with ENUM column", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.driver.createSchemaBuilder().build()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be able to read table data with ENUM", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.driver.createSchemaBuilder().build()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 2:
                    table = _a.sent();
                    table.should.not.be.undefined;
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should save data with ENUM", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, queryRunner, table, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.driver.createSchemaBuilder().build()];
                case 1:
                    _a.sent();
                    postRepository = connection.getRepository(Post_1.Post);
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 2:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    post = new Post_1.Post();
                    post.enum = "A";
                    post.name = "Post #1";
                    return [4 /*yield*/, postRepository.save(post)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1)];
                case 5:
                    loadedPost = (_a.sent());
                    loadedPost.enum.should.be.equal(post.enum);
                    table.findColumnByName("enum").type.should.be.equal("enum");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should create ENUM column and revert creation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.driver.createSchemaBuilder().build()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.addColumn("schema.post", new src_1.TableColumn({
                            name: "newEnum",
                            type: "enum",
                            enum: ["Apple", "Pineapple"]
                        }))];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 3:
                    table = _a.sent();
                    table.findColumnByName("newEnum").type.should.be.equal("enum");
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 5:
                    table = _a.sent();
                    chai_1.expect(table.findColumnByName("newEnum")).to.be.undefined;
                    return [4 /*yield*/, queryRunner.release()];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should drop ENUM column and revert drop", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, enumColumn;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.driver.createSchemaBuilder().build()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 2:
                    table = _a.sent();
                    enumColumn = table.findColumnByName("enum");
                    return [4 /*yield*/, queryRunner.dropColumn(table, enumColumn)];
                case 3:
                    _a.sent();
                    chai_1.expect(table.findColumnByName("enum")).to.be.undefined;
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 5:
                    table = _a.sent();
                    table.findColumnByName("enum").type.should.be.equal("enum");
                    return [4 /*yield*/, queryRunner.release()];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should create table with ENUM column and revert creation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, enumColumn;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.driver.createSchemaBuilder().build()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.createTable(new src_1.Table({
                            name: "schema.question",
                            columns: [
                                {
                                    name: "enum",
                                    type: "enum",
                                    enum: ["Apple", "Banana", "Cherry"]
                                }
                            ]
                        }))];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("schema.question")];
                case 3:
                    table = _a.sent();
                    enumColumn = table.findColumnByName("enum");
                    enumColumn.type.should.be.equal("enum");
                    enumColumn.enum.should.be.eql(["Apple", "Banana", "Cherry"]);
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("question")];
                case 5:
                    table = _a.sent();
                    chai_1.expect(table).to.be.undefined;
                    return [4 /*yield*/, queryRunner.release()];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should drop table with ENUM column and revert drop", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.driver.createSchemaBuilder().build()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.dropTable("schema.post")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 3:
                    table = _a.sent();
                    chai_1.expect(table).to.be.undefined;
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 5:
                    table = _a.sent();
                    chai_1.expect(table).to.be.not.undefined;
                    return [4 /*yield*/, queryRunner.release()];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should change non-enum column in to ENUM and revert change", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, nameColumn, changedColumn;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.driver.createSchemaBuilder().build()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 2:
                    table = _a.sent();
                    nameColumn = table.findColumnByName("name");
                    changedColumn = nameColumn.clone();
                    changedColumn.type = "enum";
                    changedColumn.enum = ["Apple", "Banana", "Cherry"];
                    return [4 /*yield*/, queryRunner.changeColumn(table, nameColumn, changedColumn)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 4:
                    table = _a.sent();
                    changedColumn = table.findColumnByName("name");
                    changedColumn.type.should.be.equal("enum");
                    changedColumn.enum.should.be.eql(["Apple", "Banana", "Cherry"]);
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 6:
                    table = _a.sent();
                    nameColumn = table.findColumnByName("name");
                    nameColumn.type.should.be.equal("character varying");
                    chai_1.expect(nameColumn.enum).to.be.undefined;
                    return [4 /*yield*/, queryRunner.release()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should change ENUM column in to non-enum and revert change", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, enumColumn, changedColumn;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.driver.createSchemaBuilder().build()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 2:
                    table = _a.sent();
                    enumColumn = table.findColumnByName("enum");
                    changedColumn = enumColumn.clone();
                    changedColumn.type = "character varying";
                    changedColumn.enum = undefined;
                    return [4 /*yield*/, queryRunner.changeColumn(table, enumColumn, changedColumn)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 4:
                    table = _a.sent();
                    changedColumn = table.findColumnByName("enum");
                    changedColumn.type.should.be.equal("character varying");
                    chai_1.expect(changedColumn.enum).to.be.undefined;
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 6:
                    table = _a.sent();
                    enumColumn = table.findColumnByName("enum");
                    enumColumn.type.should.be.equal("enum");
                    enumColumn.enum.should.be.eql(["A", "B", "C"]);
                    return [4 /*yield*/, queryRunner.release()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should change ENUM column and revert change", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, enumColumn, changedColumn;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.driver.createSchemaBuilder().build()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 2:
                    table = _a.sent();
                    enumColumn = table.findColumnByName("enum");
                    changedColumn = enumColumn.clone();
                    changedColumn.enum = ["C", "D", "E"];
                    return [4 /*yield*/, queryRunner.changeColumn(table, enumColumn, changedColumn)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 4:
                    table = _a.sent();
                    table.findColumnByName("enum").enum.should.be.eql(["C", "D", "E"]);
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 6:
                    table = _a.sent();
                    table.findColumnByName("enum").enum.should.be.eql(["A", "B", "C"]);
                    return [4 /*yield*/, queryRunner.release()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should rename ENUM when column renamed and revert rename", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, enumColumn, changedColumn, result;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.driver.createSchemaBuilder().build()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 2:
                    table = _a.sent();
                    enumColumn = table.findColumnByName("enum");
                    changedColumn = enumColumn.clone();
                    changedColumn.name = "enumerable";
                    return [4 /*yield*/, queryRunner.changeColumn(table, enumColumn, changedColumn)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.query("SELECT \"n\".\"nspname\", \"t\".\"typname\" FROM \"pg_type\" \"t\" " +
                            "INNER JOIN \"pg_namespace\" \"n\" ON \"n\".\"oid\" = \"t\".\"typnamespace\" " +
                            "WHERE \"n\".\"nspname\" = 'schema' AND \"t\".\"typname\" = 'post_enumerable_enum'")];
                case 4:
                    result = _a.sent();
                    result.length.should.be.equal(1);
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.query("SELECT \"n\".\"nspname\", \"t\".\"typname\" FROM \"pg_type\" \"t\" " +
                            "INNER JOIN \"pg_namespace\" \"n\" ON \"n\".\"oid\" = \"t\".\"typnamespace\" " +
                            "WHERE \"n\".\"nspname\" = 'schema' AND \"t\".\"typname\" = 'post_enum_enum'")];
                case 6:
                    result = _a.sent();
                    result.length.should.be.equal(1);
                    return [4 /*yield*/, queryRunner.release()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should rename ENUM when table renamed and revert rename", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, result;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.driver.createSchemaBuilder().build()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("schema.post")];
                case 2:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.renameTable(table, "question")];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.query("SELECT \"n\".\"nspname\", \"t\".\"typname\" FROM \"pg_type\" \"t\" " +
                            "INNER JOIN \"pg_namespace\" \"n\" ON \"n\".\"oid\" = \"t\".\"typnamespace\" " +
                            "WHERE \"n\".\"nspname\" = 'schema' AND \"t\".\"typname\" = 'question_enum_enum'")];
                case 4:
                    result = _a.sent();
                    result.length.should.be.equal(1);
                    return [4 /*yield*/, queryRunner.executeMemoryDownSql()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.query("SELECT \"n\".\"nspname\", \"t\".\"typname\" FROM \"pg_type\" \"t\" " +
                            "INNER JOIN \"pg_namespace\" \"n\" ON \"n\".\"oid\" = \"t\".\"typnamespace\" " +
                            "WHERE \"n\".\"nspname\" = 'schema' AND \"t\".\"typname\" = 'post_enum_enum'")];
                case 6:
                    result = _a.sent();
                    result.length.should.be.equal(1);
                    return [4 /*yield*/, queryRunner.release()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1997.js.map