"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var Author_1 = require("./entity/Author");
var Category_1 = require("./entity/Category");
var options = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [Post_1.Post, Author_1.Author, Category_1.Category]
};
index_1.createConnection(options).then(function (connection) {
    var postRepository = connection.getRepository(Post_1.Post);
    var author = new Author_1.Author();
    author.name = "Umed";
    var category1 = new Category_1.Category();
    category1.name = "Category #1";
    var category2 = new Category_1.Category();
    category2.name = "Category #2";
    var post = new Post_1.Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.author = author;
    post.categories = [category1, category2];
    postRepository
        .save(post)
        .then(function (post) {
        console.log("Post has been saved. Lets load it now.");
        return postRepository.find({
            join: {
                alias: "post",
                leftJoinAndSelect: {
                    categories: "post.categories",
                    author: "post.user" // note that table column is used, not object property
                }
            }
        });
    })
        .then(function (loadedPosts) {
        console.log("loadedPosts: ", loadedPosts);
    })
        .catch(function (error) { return console.log(error.stack); });
}, function (error) { return console.log("Cannot connect: ", error); });
//# sourceMappingURL=app.js.map