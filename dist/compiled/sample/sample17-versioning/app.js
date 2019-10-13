"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var options = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [Post_1.Post]
};
index_1.createConnection(options).then(function (connection) {
    var post = new Post_1.Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    var postRepository = connection.getRepository(Post_1.Post);
    postRepository
        .save(post)
        .then(function (post) {
        console.log("Post has been saved: ", post);
        console.log("Post's version is " + post.version + ". Lets change post's text and update it:");
        post.title = "updating title";
        return postRepository.save(post);
    }).then(function (post) {
        console.log("Post has been updated. Post's version is " + post.version);
    });
}, function (error) { return console.log("Cannot connect: ", error); });
//# sourceMappingURL=app.js.map