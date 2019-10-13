"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
var Guest_1 = require("./entity/v1/Guest");
var Comment_1 = require("./entity/v1/Comment");
var Guest_2 = require("./entity/v2/Guest");
var Comment_2 = require("./entity/v2/Comment");
var View_1 = require("./entity/View");
var Category_1 = require("./entity/Category");
var test_utils_1 = require("../../utils/test-utils");
var Repository_1 = require("../../../src/repository/Repository");
var TreeRepository_1 = require("../../../src/repository/TreeRepository");
var index_1 = require("../../../src/index");
var NoConnectionForRepositoryError_1 = require("../../../src/error/NoConnectionForRepositoryError");
var EntityManager_1 = require("../../../src/entity-manager/EntityManager");
var CannotGetEntityManagerNotConnectedError_1 = require("../../../src/error/CannotGetEntityManagerNotConnectedError");
var PromiseUtils_1 = require("../../../src/util/PromiseUtils");
describe("Connection", function () {
    // const resourceDir = __dirname + "/../../../../../test/functional/connection/";
    describe("before connection is established", function () {
        var _this = this;
        var connection;
        before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var options;
            return tslib_1.__generator(this, function (_a) {
                options = test_utils_1.setupSingleTestingConnection("mysql", {
                    name: "default",
                    entities: []
                });
                if (!options)
                    return [2 /*return*/];
                connection = index_1.getConnectionManager().create(options);
                return [2 /*return*/];
            });
        }); });
        after(function () {
            if (connection && connection.isConnected)
                return connection.close();
            return Promise.resolve();
        });
        it("connection.isConnected should be false", function () {
            if (!connection)
                return;
            connection.isConnected.should.be.false;
        });
        it.skip("entity manager and reactive entity manager should not be accessible", function () {
            chai_1.expect(function () { return connection.manager; }).to.throw(CannotGetEntityManagerNotConnectedError_1.CannotGetEntityManagerNotConnectedError);
            // expect(() => connection.reactiveEntityManager).to.throw(CannotGetEntityManagerNotConnectedError);
        });
        // todo: they aren't promises anymore
        /*it("import entities, entity schemas, subscribers and naming strategies should work", () => {
         return Promise.all([
         connection.importEntities([Post]).should.be.fulfilled,
         connection.importEntitySchemas([]).should.be.fulfilled,
         connection.importSubscribers([]).should.be.fulfilled,
         connection.importNamingStrategies([]).should.be.fulfilled,
         connection.importEntitiesFromDirectories([]).should.be.fulfilled,
         connection.importEntitySchemaFromDirectories([]).should.be.fulfilled,
         connection.importSubscribersFromDirectories([]).should.be.fulfilled,
         connection.importNamingStrategiesFromDirectories([]).should.be.fulfilled
         ]);
         });*/
        it("should not be able to close", function () {
            if (!connection)
                return;
            return connection.close().should.be.rejected; // CannotCloseNotConnectedError
        });
        it("should not be able to sync a schema", function () {
            if (!connection)
                return;
            return connection.synchronize().should.be.rejected; // CannotCloseNotConnectedError
        });
        it.skip("should not be able to use repositories", function () {
            if (!connection)
                return;
            chai_1.expect(function () { return connection.getRepository(Post_1.Post); }).to.throw(NoConnectionForRepositoryError_1.NoConnectionForRepositoryError);
            chai_1.expect(function () { return connection.getTreeRepository(Category_1.Category); }).to.throw(NoConnectionForRepositoryError_1.NoConnectionForRepositoryError);
            // expect(() => connection.getReactiveRepository(Post)).to.throw(NoConnectionForRepositoryError);
            // expect(() => connection.getReactiveTreeRepository(Category)).to.throw(NoConnectionForRepositoryError);
        });
        it("should be able to connect", function () {
            if (!connection)
                return;
            return connection.connect().should.be.fulfilled;
        });
    });
    describe.skip("establishing connection", function () {
        it("should throw DriverOptionNotSetError when extra.socketPath and host is missing", function () {
            chai_1.expect(function () {
                index_1.getConnectionManager().create({
                    type: "mysql",
                    username: "test",
                    password: "test",
                    database: "test",
                    entities: [],
                    dropSchema: false,
                    schemaCreate: false,
                    enabledDrivers: ["mysql"],
                });
            }).to.throw(Error);
        });
    });
    describe("after connection is established successfully", function () {
        var _this = this;
        var connections;
        beforeEach(function () { return test_utils_1.createTestingConnections({ entities: [Post_1.Post, Category_1.Category], schemaCreate: true, dropSchema: true }).then(function (all) { return connections = all; }); });
        afterEach(function () { return test_utils_1.closeTestingConnections(connections); });
        it("connection.isConnected should be true", function () { return connections.forEach(function (connection) {
            connection.isConnected.should.be.true;
        }); });
        it("entity manager and reactive entity manager should be accessible", function () { return connections.forEach(function (connection) {
            chai_1.expect(connection.manager).to.be.instanceOf(EntityManager_1.EntityManager);
            // expect(connection.reactiveEntityManager).to.be.instanceOf(ReactiveEntityManager);
        }); });
        it("should not be able to connect again", function () { return connections.forEach(function (connection) {
            return connection.connect().should.be.rejected; // CannotConnectAlreadyConnectedError
        }); });
        it("should be able to close a connection", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, Promise.all(connections.map(function (connection) {
                        return connection.close();
                    }))];
            });
        }); });
    });
    describe("working with repositories after connection is established successfully", function () {
        var connections;
        before(function () { return test_utils_1.createTestingConnections({ entities: [Post_1.Post, Category_1.Category], schemaCreate: true, dropSchema: true }).then(function (all) { return connections = all; }); });
        after(function () { return test_utils_1.closeTestingConnections(connections); });
        it("should be able to get simple entity repository", function () { return connections.forEach(function (connection) {
            connection.getRepository(Post_1.Post).should.be.instanceOf(Repository_1.Repository);
            connection.getRepository(Post_1.Post).should.not.be.instanceOf(TreeRepository_1.TreeRepository);
            connection.getRepository(Post_1.Post).target.should.be.eql(Post_1.Post);
        }); });
        it("should be able to get tree entity repository", function () { return connections.forEach(function (connection) {
            connection.getTreeRepository(Category_1.Category).should.be.instanceOf(TreeRepository_1.TreeRepository);
            connection.getTreeRepository(Category_1.Category).target.should.be.eql(Category_1.Category);
        }); });
        // it("should be able to get simple entity reactive repository", () => connections.forEach(connection => {
        //     connection.getReactiveRepository(Post).should.be.instanceOf(ReactiveRepository);
        //     connection.getReactiveRepository(Post).should.not.be.instanceOf(TreeReactiveRepository);
        //     connection.getReactiveRepository(Post).target.should.be.eql(Post);
        // }));
        // it("should be able to get tree entity reactive repository", () => connections.forEach(connection => {
        //     connection.getReactiveTreeRepository(Category).should.be.instanceOf(TreeReactiveRepository);
        //     connection.getReactiveTreeRepository(Category).target.should.be.eql(Category);
        // }));
        it("should not be able to get tree entity repository of the non-tree entities", function () { return connections.forEach(function (connection) {
            chai_1.expect(function () { return connection.getTreeRepository(Post_1.Post); }).to.throw(Error); // RepositoryNotTreeError
            // expect(() => connection.getReactiveTreeRepository(Post)).to.throw(RepositoryNotTreeError);
        }); });
        it("should not be able to get repositories that are not registered", function () { return connections.forEach(function (connection) {
            chai_1.expect(function () { return connection.getRepository("SomeEntity"); }).to.throw(Error); // RepositoryNotTreeError
            chai_1.expect(function () { return connection.getTreeRepository("SomeEntity"); }).to.throw(Error); // RepositoryNotTreeError
            // expect(() => connection.getReactiveRepository("SomeEntity")).to.throw(RepositoryNotFoundError);
            // expect(() => connection.getReactiveTreeRepository("SomeEntity")).to.throw(RepositoryNotFoundError);
        }); });
    });
    describe("generate a schema when connection.syncSchema is called", function () {
        var _this = this;
        var connections;
        before(function () { return test_utils_1.createTestingConnections({ entities: [Post_1.Post], schemaCreate: true, dropSchema: true }).then(function (all) { return connections = all; }); });
        after(function () { return test_utils_1.closeTestingConnections(connections); });
        it("database should be empty after schema is synced with dropDatabase flag", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var postRepository, post, loadedPost, againLoadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        postRepository = connection.getRepository(Post_1.Post);
                        post = new Post_1.Post();
                        post.title = "new post";
                        return [4 /*yield*/, postRepository.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, postRepository.findOne(post.id)];
                    case 2:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost).to.be.eql(post);
                        return [4 /*yield*/, connection.synchronize(true)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, postRepository.findOne(post.id)];
                    case 4:
                        againLoadedPost = _a.sent();
                        chai_1.expect(againLoadedPost).to.be.undefined;
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("log a schema when connection.logSyncSchema is called", function () {
        var _this = this;
        var connections;
        before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                            entities: [Post_1.Post]
                        })];
                    case 1: return [2 /*return*/, connections = _a.sent()];
                }
            });
        }); });
        after(function () { return test_utils_1.closeTestingConnections(connections); });
        it("should return sql log properly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, connection.driver.createSchemaBuilder().log()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("after connection is closed successfully", function () {
        // open a close connections
        var connections = [];
        before(function () { return test_utils_1.createTestingConnections({ entities: [Post_1.Post], schemaCreate: true, dropSchema: true }).then(function (all) {
            connections = all;
            return Promise.all(connections.map(function (connection) { return connection.close(); }));
        }); });
        it("should not be able to close already closed connection", function () { return connections.forEach(function (connection) {
            return connection.close().should.be.rejected; // CannotCloseNotConnectedError
        }); });
        it("connection.isConnected should be false", function () { return connections.forEach(function (connection) {
            connection.isConnected.should.be.false;
        }); });
    });
    describe("skip schema generation when synchronize option is set to false", function () {
        var _this = this;
        var connections;
        beforeEach(function () { return test_utils_1.createTestingConnections({ entities: [View_1.View], dropSchema: true }).then(function (all) { return connections = all; }); });
        afterEach(function () { return test_utils_1.closeTestingConnections(connections); });
        it("database should be empty after schema sync", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var queryRunner, schema;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, connection.synchronize(true)];
                    case 1:
                        _a.sent();
                        queryRunner = connection.createQueryRunner();
                        return [4 /*yield*/, queryRunner.getTables(["view"])];
                    case 2:
                        schema = _a.sent();
                        return [4 /*yield*/, queryRunner.release()];
                    case 3:
                        _a.sent();
                        chai_1.expect(schema.some(function (table) { return table.name === "view"; })).to.be.false;
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("different names of the same content of the schema", function () {
        var connections;
        beforeEach(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var connections1, connections2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                            name: "test",
                            enabledDrivers: ["postgres"],
                            entities: [Comment_1.Comment, Guest_1.Guest],
                            schema: "test-schema",
                            dropSchema: true,
                        })];
                    case 1:
                        connections1 = _a.sent();
                        return [4 /*yield*/, test_utils_1.createTestingConnections({
                                name: "another",
                                enabledDrivers: ["postgres"],
                                entities: [Comment_1.Comment, Guest_1.Guest],
                                schema: "another-schema",
                                dropSchema: true
                            })];
                    case 2:
                        connections2 = _a.sent();
                        connections = tslib_1.__spread(connections1, connections2);
                        return [2 /*return*/];
                }
            });
        }); });
        after(function () { return test_utils_1.closeTestingConnections(connections); });
        it("should not interfere with each other", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var connections1, connections2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(connections, function (c) { return c.synchronize(); })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, test_utils_1.closeTestingConnections(connections)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, test_utils_1.createTestingConnections({
                                name: "test",
                                enabledDrivers: ["postgres"],
                                entities: [Comment_2.Comment, Guest_2.Guest],
                                schema: "test-schema",
                                dropSchema: false,
                                schemaCreate: true
                            })];
                    case 3:
                        connections1 = _a.sent();
                        return [4 /*yield*/, test_utils_1.createTestingConnections({
                                name: "another",
                                enabledDrivers: ["postgres"],
                                entities: [Comment_2.Comment, Guest_2.Guest],
                                schema: "another-schema",
                                dropSchema: false,
                                schemaCreate: true
                            })];
                    case 4:
                        connections2 = _a.sent();
                        connections = tslib_1.__spread(connections1, connections2);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("can change postgres default schema name", function () {
        var connections;
        beforeEach(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var connections1, connections2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                            name: "test",
                            enabledDrivers: ["postgres"],
                            entities: [Comment_1.Comment, Guest_1.Guest],
                            schema: "test-schema",
                            dropSchema: true,
                        })];
                    case 1:
                        connections1 = _a.sent();
                        return [4 /*yield*/, test_utils_1.createTestingConnections({
                                name: "another",
                                enabledDrivers: ["postgres"],
                                entities: [Comment_1.Comment, Guest_1.Guest],
                                schema: "another-schema",
                                dropSchema: true
                            })];
                    case 2:
                        connections2 = _a.sent();
                        connections = tslib_1.__spread(connections1, connections2);
                        return [2 /*return*/];
                }
            });
        }); });
        afterEach(function () { return test_utils_1.closeTestingConnections(connections); });
        it("schema name can be set", function () {
            return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var schemaName, comment, commentRepo, queryRunner, rows;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, connection.synchronize(true)];
                        case 1:
                            _a.sent();
                            schemaName = connection.options.schema;
                            comment = new Comment_1.Comment();
                            comment.title = "Change SchemaName";
                            comment.context = "To " + schemaName;
                            commentRepo = connection.getRepository(Comment_1.Comment);
                            return [4 /*yield*/, commentRepo.save(comment)];
                        case 2:
                            _a.sent();
                            queryRunner = connection.createQueryRunner();
                            return [4 /*yield*/, queryRunner.query("select * from \"" + schemaName + "\".\"comment\" where id = $1", [comment.id])];
                        case 3:
                            rows = _a.sent();
                            return [4 /*yield*/, queryRunner.release()];
                        case 4:
                            _a.sent();
                            chai_1.expect(rows[0]["context"]).to.be.eq(comment.context);
                            return [2 /*return*/];
                    }
                });
            }); }));
        });
    });
});
//# sourceMappingURL=connection.js.map