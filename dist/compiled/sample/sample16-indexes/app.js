"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var BasePost_1 = require("./entity/BasePost");
var options = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [Post_1.Post, BasePost_1.BasePost]
};
index_1.createConnection(options).then(function (connection) {
    var post = new Post_1.Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.likesCount = 0;
    var postRepository = connection.getRepository(Post_1.Post);
    postRepository
        .save(post)
        .then(function (post) { return console.log("Post has been saved"); });
}, function (error) { return console.log("Cannot connect: ", error); });
//# sourceMappingURL=app.js.map