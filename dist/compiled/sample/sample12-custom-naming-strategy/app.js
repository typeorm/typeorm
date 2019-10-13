"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var CustomNamingStrategy_1 = require("./naming-strategy/CustomNamingStrategy");
var options = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    namingStrategy: new CustomNamingStrategy_1.CustomNamingStrategy(),
    entities: [Post_1.Post]
};
index_1.createConnection(options).then(function (connection) {
    var post = new Post_1.Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    var postRepository = connection.getRepository(Post_1.Post);
    postRepository
        .save(post)
        .then(function (post) { return console.log("Post has been saved"); })
        .catch(function (error) { return console.log("Cannot save. Error: ", error); });
}, function (error) { return console.log("Cannot connect: ", error); });
//# sourceMappingURL=app.js.map