"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var PostAuthor_1 = require("./entity/PostAuthor");
var options = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    entities: [Post_1.Post, PostAuthor_1.PostAuthor]
};
index_1.createConnection(options).then(function (connection) {
    var author = new PostAuthor_1.PostAuthor();
    author.name = "Umed";
    var post = new Post_1.Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.author = author;
    var postRepository = connection.getRepository(Post_1.Post);
    postRepository
        .save(post)
        .then(function (post) { return console.log("Post has been saved"); })
        .catch(function (error) { return console.log("Cannot save. Error: ", error); });
}, function (error) { return console.log("Cannot connect: ", error); });
//# sourceMappingURL=app.js.map