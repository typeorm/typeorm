"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var Author_1 = require("./entity/Author");
var PostRepository_1 = require("./repository/PostRepository");
var AuthorRepository_1 = require("./repository/AuthorRepository");
var UserRepository_1 = require("./repository/UserRepository");
var User_1 = require("./entity/User");
var options = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    logging: ["query", "error"],
    entities: [Post_1.Post, Author_1.Author, User_1.User],
};
index_1.createConnection(options).then(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var author, loadedAuthor, post, loadedPost, userRepository, loadedUser;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, connection
                    .getCustomRepository(AuthorRepository_1.AuthorRepository)
                    .createAndSave("Umed", "Khudoiberdiev")];
            case 1:
                author = _a.sent();
                console.log("Author saved: ", author);
                return [4 /*yield*/, connection
                        .getCustomRepository(AuthorRepository_1.AuthorRepository)
                        .findMyAuthor()];
            case 2:
                loadedAuthor = _a.sent();
                console.log("Author loaded: ", loadedAuthor);
                post = connection
                    .getCustomRepository(PostRepository_1.PostRepository)
                    .create();
                post.title = "Hello Repositories!";
                return [4 /*yield*/, connection
                        .manager
                        .getCustomRepository(PostRepository_1.PostRepository)
                        .save(post)];
            case 3:
                _a.sent();
                return [4 /*yield*/, connection
                        .manager
                        .getCustomRepository(PostRepository_1.PostRepository)
                        .findMyPost()];
            case 4:
                loadedPost = _a.sent();
                console.log("Post persisted! Loaded post: ", loadedPost);
                userRepository = connection.manager.getCustomRepository(UserRepository_1.UserRepository);
                return [4 /*yield*/, userRepository.createAndSave("Umed", "Khudoiberdiev")];
            case 5:
                _a.sent();
                return [4 /*yield*/, userRepository.findByName("Umed", "Khudoiberdiev")];
            case 6:
                loadedUser = _a.sent();
                console.log("User loaded: ", loadedUser);
                return [2 /*return*/];
        }
    });
}); }).catch(function (error) { return console.log("Error: ", error); });
//# sourceMappingURL=app.js.map