"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var PostDetails_1 = require("./entity/PostDetails");
var PostCategory_1 = require("./entity/PostCategory");
var PostMetadata_1 = require("./entity/PostMetadata");
var PostImage_1 = require("./entity/PostImage");
var PostInformation_1 = require("./entity/PostInformation");
var PostAuthor_1 = require("./entity/PostAuthor");
var options = {
    // type: "mssql",
    // host: "192.168.1.10",
    // username: "sa",
    // password: "admin12345",
    // database: "test",
    type: "oracle",
    host: "localhost",
    username: "system",
    password: "oracle",
    port: 1521,
    sid: "xe.oracle.docker",
    synchronize: true,
    logging: ["query", "error"],
    entities: [Post_1.Post, PostDetails_1.PostDetails, PostCategory_1.PostCategory, PostMetadata_1.PostMetadata, PostImage_1.PostImage, PostInformation_1.PostInformation, PostAuthor_1.PostAuthor]
};
index_1.createConnection(options).then(function (connection) {
    var details = new PostDetails_1.PostDetails();
    details.authorName = "Umed";
    details.comment = "about post";
    details.metadata = "post,details,one-to-one";
    var post = new Post_1.Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.details = details;
    var postRepository = connection.getRepository(Post_1.Post);
    postRepository
        .save(post)
        .then(function (post) { return console.log("Post has been saved"); })
        .catch(function (error) { return console.log("Cannot save. Error: ", error); });
}).catch(function (error) { return console.log("Error: ", error); });
//# sourceMappingURL=app.js.map