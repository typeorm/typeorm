"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var PostCategory_1 = require("./entity/PostCategory");
var PostAuthor_1 = require("./entity/PostAuthor");
var options = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    entities: [__dirname + "/entity/*"],
    subscribers: [__dirname + "/subscriber/*"]
};
index_1.createConnection(options).then(function (connection) {
    var category1 = new PostCategory_1.PostCategory();
    category1.name = "post category #1";
    var category2 = new PostCategory_1.PostCategory();
    category2.name = "post category #2";
    var author = new PostAuthor_1.PostAuthor();
    author.name = "Umed";
    var post = new Post_1.Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.categories.push(category1, category2);
    post.author = author;
    var postRepository = connection.getRepository(Post_1.Post);
    postRepository
        .save(post)
        .then(function (post) {
        console.log("Post has been saved");
        console.log("---------------------------");
        return postRepository.findOne(post.id);
    })
        .then(function (loadedPost) {
        console.log("post is loaded. Its uid is " + loadedPost.uid);
        console.log("Lets now load it with relations.");
        console.log("---------------------------");
        return postRepository
            .createQueryBuilder("p")
            .leftJoinAndSelect("p.author", "author")
            .leftJoinAndSelect("p.categories", "categories")
            .where("p.id = :id", { id: loadedPost.id })
            .getOne();
    })
        .then(function (loadedPost) {
        console.log("load finished. Now lets update entity");
        console.log("---------------------------");
        loadedPost.text = "post updated";
        loadedPost.author.name = "Bakha";
        return postRepository.save(loadedPost);
    })
        .then(function (loadedPost) {
        console.log("update finished. Now lets remove entity");
        console.log("---------------------------");
        return postRepository.remove(loadedPost);
    })
        .then(function (loadedPost) {
        console.log("post removed.");
    })
        .catch(function (error) { return console.log("Cannot save. Error: ", error.stack ? error.stack : error); });
}, function (error) { return console.log("Cannot connect: ", error.stack ? error.stack : error); });
//# sourceMappingURL=app.js.map