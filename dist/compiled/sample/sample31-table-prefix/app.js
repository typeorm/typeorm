"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var Author_1 = require("./entity/Author");
var Category_1 = require("./entity/Category");
var options = {
    type: "sqlite",
    database: "temp/sqlitedb.db",
    entityPrefix: "samples_",
    synchronize: true,
    logging: ["query", "error"],
    entities: [Post_1.Post, Author_1.Author, Category_1.Category],
};
index_1.createConnection(options).then(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var category1, category2, author, post, postRepository;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                category1 = new Category_1.Category();
                category1.name = "Animals";
                category2 = new Category_1.Category();
                category2.name = "People";
                author = new Author_1.Author();
                author.firstName = "Umed";
                author.lastName = "Khudoiberdiev";
                post = new Post_1.Post();
                post.text = "Hello how are you?";
                post.title = "hello";
                post.author = author;
                post.categories = [category1, category2];
                postRepository = connection.getRepository(Post_1.Post);
                return [4 /*yield*/, postRepository.save(post)];
            case 1:
                _a.sent();
                console.log("Post has been saved");
                return [2 /*return*/];
        }
    });
}); }).catch(function (error) { return console.log("Error: ", error); });
//# sourceMappingURL=app.js.map