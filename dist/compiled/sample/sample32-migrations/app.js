"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var Author_1 = require("./entity/Author");
var options = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    logging: ["query", "error"],
    entities: [Post_1.Post, Author_1.Author],
};
index_1.createConnection(options).then(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var author, post, postRepository;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                author = new Author_1.Author();
                author.firstName = "Umed";
                author.lastName = "Khudoiberdiev";
                post = new Post_1.Post();
                post.title = "hello";
                post.author = author;
                postRepository = connection.getRepository(Post_1.Post);
                return [4 /*yield*/, postRepository.save(post)];
            case 1:
                _a.sent();
                console.log("Database schema was created and data has been inserted into the database.");
                // close connection now
                return [4 /*yield*/, connection.close()];
            case 2:
                // close connection now
                _a.sent();
                return [4 /*yield*/, index_1.createConnection({
                        type: "mysql",
                        name: "mysql",
                        host: "localhost",
                        port: 3306,
                        username: "test",
                        password: "test",
                        database: "test",
                        logging: ["query", "error"],
                        entities: [
                            Post_1.Post,
                            Author_1.Author
                        ],
                        migrations: [
                            __dirname + "/migrations/*{.js,.ts}"
                        ]
                    })];
            case 3:
                // now create a new connection
                connection = _a.sent();
                // run all migrations
                return [4 /*yield*/, connection.runMigrations()];
            case 4:
                // run all migrations
                _a.sent();
                // and undo migrations two times (because we have two migrations)
                return [4 /*yield*/, connection.undoLastMigration()];
            case 5:
                // and undo migrations two times (because we have two migrations)
                _a.sent();
                return [4 /*yield*/, connection.undoLastMigration()];
            case 6:
                _a.sent();
                console.log("Done. We run two migrations then reverted them.");
                return [2 /*return*/];
        }
    });
}); }).catch(function (error) { return console.log("Error: ", error); });
//# sourceMappingURL=app.js.map