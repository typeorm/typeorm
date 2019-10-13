"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var PostDetails_1 = require("./entity/PostDetails");
var options = {
    type: "mssql",
    host: "192.168.1.10",
    username: "sa",
    password: "admin12345",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [__dirname + "/entity/*"]
};
index_1.createConnection(options).then(function (connection) {
    var details1 = new PostDetails_1.PostDetails();
    details1.comment = "People";
    var details2 = new PostDetails_1.PostDetails();
    details2.comment = "Human";
    var post = new Post_1.Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.details = [details1, details2];
    var postRepository = connection.getRepository(Post_1.Post);
    postRepository
        .save(post)
        .then(function (post) { return console.log("Post has been saved"); })
        .catch(function (error) { return console.log("Cannot save. Error: ", error); });
}, function (error) { return console.log("Cannot connect: ", error); });
//# sourceMappingURL=app.js.map