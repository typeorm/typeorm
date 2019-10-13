"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
var ConnectionManager_1 = require("../../../src/connection/ConnectionManager");
var MysqlDriver_1 = require("../../../src/driver/mysql/MysqlDriver");
var PrimaryGeneratedColumn_1 = require("../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../src/decorator/columns/Column");
var Entity_1 = require("../../../src/decorator/entity/Entity");
describe("ConnectionManager", function () {
    var Post = /** @class */ (function () {
        function Post(id, title) {
            this.id = id;
            this.title = title;
        }
        tslib_1.__decorate([
            PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
            tslib_1.__metadata("design:type", Number)
        ], Post.prototype, "id", void 0);
        tslib_1.__decorate([
            Column_1.Column(),
            tslib_1.__metadata("design:type", String)
        ], Post.prototype, "title", void 0);
        Post = tslib_1.__decorate([
            Entity_1.Entity(),
            tslib_1.__metadata("design:paramtypes", [Number, String])
        ], Post);
        return Post;
    }());
    describe("create", function () {
        it("should create a mysql connection when mysql driver is specified", function () {
            var options = test_utils_1.setupSingleTestingConnection("mysql", {
                name: "default",
                entities: []
            });
            if (!options)
                return;
            var connectionManager = new ConnectionManager_1.ConnectionManager();
            var connection = connectionManager.create(options);
            connection.name.should.be.equal("default");
            connection.driver.should.be.instanceOf(MysqlDriver_1.MysqlDriver);
            connection.isConnected.should.be.false;
        });
        /* it("should create a postgres connection when postgres driver is specified", () => {
             const options: ConnectionOptions = {
                 name: "myPostgresConnection",
                 driver: createTestingConnectionOptions("postgres")
             };
             const connectionManager = new ConnectionManager();
             const connection = connectionManager.create(options);
             connection.name.should.be.equal("myPostgresConnection");
             connection.driver.should.be.instanceOf(PostgresDriver);
             connection.isConnected.should.be.false;
         });*/
    });
    /*describe("createAndConnect", function() {

        it("should create a mysql connection when mysql driver is specified AND connect to it", async () => {
            const options: ConnectionOptions = setupSingleTestingConnection("mysql", {
                name: "default",
                entities: []
            });
            const connectionManager = new ConnectionManager();
            const connection = await connectionManager.createAndConnect(options);
            connection.name.should.be.equal("default");
            connection.driver.should.be.instanceOf(MysqlDriver);
            connection.isConnected.should.be.true;
            await connection.close();
        });

    /!*    it("should create a postgres connection when postgres driver is specified AND connect to it", async () => {
            const options: ConnectionOptions = {
                name: "myPostgresConnection",
                driver: createTestingConnectionOptions("postgres")
            };
            const connectionManager = new ConnectionManager();
            const connection = await connectionManager.createAndConnect(options);
            connection.name.should.be.equal("myPostgresConnection");
            connection.driver.should.be.instanceOf(PostgresDriver);
            connection.isConnected.should.be.true;
            await connection.close();
        });*!/

    });*/
    describe("get", function () {
        it("should give connection with a requested name", function () {
            var options = test_utils_1.setupSingleTestingConnection("mysql", {
                name: "myMysqlConnection",
                entities: []
            });
            if (!options)
                return;
            var connectionManager = new ConnectionManager_1.ConnectionManager();
            var connection = connectionManager.create(options);
            connection.driver.should.be.instanceOf(MysqlDriver_1.MysqlDriver);
            connectionManager.get("myMysqlConnection").should.be.equal(connection);
        });
        it("should throw an error if connection with the given name was not found", function () {
            var options = test_utils_1.setupSingleTestingConnection("mysql", {
                name: "myMysqlConnection",
                entities: []
            });
            if (!options)
                return;
            var connectionManager = new ConnectionManager_1.ConnectionManager();
            var connection = connectionManager.create(options);
            connection.driver.should.be.instanceOf(MysqlDriver_1.MysqlDriver);
            chai_1.expect(function () { return connectionManager.get("myPostgresConnection"); }).to.throw(Error);
        });
    });
    describe("create connection options", function () {
        var _this = this;
        it("should not drop the database if dropSchema was not specified", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var options, connectionManager, connection, post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = test_utils_1.setupSingleTestingConnection("mysql", {
                            name: "myMysqlConnection",
                            schemaCreate: true,
                            entities: [Post]
                        });
                        if (!options)
                            return [2 /*return*/];
                        connectionManager = new ConnectionManager_1.ConnectionManager();
                        return [4 /*yield*/, connectionManager.create(options).connect()];
                    case 1:
                        connection = _a.sent();
                        post = new Post(1, "Hello post");
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, connection.close()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, connectionManager.create(options).connect()];
                    case 4:
                        // recreate connection and find previously saved post
                        connection = _a.sent();
                        return [4 /*yield*/, connection.manager.findOne(Post, 1)];
                    case 5:
                        loadedPost = (_a.sent());
                        loadedPost.should.be.instanceof(Post);
                        loadedPost.should.be.eql({ id: 1, title: "Hello post" });
                        return [4 /*yield*/, connection.close()];
                    case 6:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("should drop the database if dropSchema was set to true (mysql)", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var options, connectionManager, connection, post, loadedPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = test_utils_1.setupSingleTestingConnection("mysql", {
                            name: "myMysqlConnection",
                            schemaCreate: true,
                            dropSchema: true,
                            entities: [Post]
                        });
                        if (!options)
                            return [2 /*return*/];
                        connectionManager = new ConnectionManager_1.ConnectionManager();
                        return [4 /*yield*/, connectionManager.create(options).connect()];
                    case 1:
                        connection = _a.sent();
                        post = new Post(1, "Hello post");
                        return [4 /*yield*/, connection.manager.save(post)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, connection.close()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, connectionManager.create(options).connect()];
                    case 4:
                        // recreate connection and find previously saved post
                        connection = _a.sent();
                        return [4 /*yield*/, connection.manager.findOne(Post, 1)];
                    case 5:
                        loadedPost = _a.sent();
                        chai_1.expect(loadedPost).to.be.undefined;
                        return [4 /*yield*/, connection.close()];
                    case 6:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        /*   it("should drop the database if dropSchema was set to true (postgres)", async () => {
               const options: ConnectionOptions = {
                   dropSchema: true,
                   synchronize: true,
                   driver: createTestingConnectionOptions("postgres"),
                   entities: [Post]
               };
               const connectionManager = new ConnectionManager();
   
               // create connection, save post and close connection
               let connection = await connectionManager.createAndConnect(options);
               const post = new Post(1, "Hello post");
               await connection.manager.save(post);
               await connection.close();
   
               // recreate connection and find previously saved post
               connection = await connectionManager.createAndConnect(options);
               const loadedPost = await connection.manager.findOne(Post, 1);
               expect(loadedPost).to.be.undefined;
   
               await connection.close();
            });*/
        /*    it("should drop the database if dropSchema was set to true (postgres)", async () => {
                const options: ConnectionOptions = {
                    dropSchema: true,
                    synchronize: true,
                    driver: createTestingConnectionOptions("postgres"),
                    entities: [Post]
                };
                const connectionManager = new ConnectionManager();
    
                // create connection, save post and close connection
                let connection = await connectionManager.createAndConnect(options);
                const post = new Post(1, "Hello post");
                await connection.manager.save(post);
                await connection.close();
    
                // recreate connection and find previously saved post
                connection = await connectionManager.createAndConnect(options);
                const loadedPost = await connection.manager.findOne(Post, 1);
                expect(loadedPost).to.be.undefined;
                await connection.close();
             });*/
    });
});
//# sourceMappingURL=connection-manager.js.map