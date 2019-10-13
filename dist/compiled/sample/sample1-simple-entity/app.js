"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var options = {
    // type: "oracle",
    // host: "localhost",
    // username: "system",
    // password: "oracle",
    // port: 1521,
    // sid: "xe.oracle.docker",
    "name": "mysql",
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "username": "test",
    "password": "test",
    "database": "test",
    // type: "postgres",
    // host: "localhost",
    // port: 5432,
    // username: "test",
    // password: "test",
    // database: "test",
    // "type": "mssql",
    // "host": "192.168.1.6",
    // "username": "sa",
    // "password": "admin12345",
    // "database": "test",
    // port: 1521,
    // type: "sqlite",
    // database: "temp/sqlitedb.db",
    // logger: "file",
    // logging: ["query", "error"],
    // logging: ["error", "schema", "query"],
    // maxQueryExecutionTime: 90,
    synchronize: true,
    entities: [Post_1.Post]
};
index_1.createConnection(options).then(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var post, postRepository;
    return tslib_1.__generator(this, function (_a) {
        post = new Post_1.Post();
        post.text = "Hello how are you?";
        post.title = "hello";
        post.likesCount = 100;
        postRepository = connection.getRepository(Post_1.Post);
        postRepository
            .save(post)
            .then(function (post) { return console.log("Post has been saved: ", post); })
            .catch(function (error) { return console.log("Cannot save. Error: ", error); });
        return [2 /*return*/];
    });
}); }, function (error) { return console.log("Cannot connect: ", error); });
//# sourceMappingURL=app.js.map