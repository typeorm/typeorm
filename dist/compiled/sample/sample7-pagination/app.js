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
    entities: [__dirname + "/entity/*"]
};
index_1.createConnection(options).then(function (connection) {
    var postRepository = connection.getRepository(Post_1.Post);
    var posts = [];
    var author = new PostAuthor_1.PostAuthor();
    author.name = "Umed";
    for (var i = 0; i < 100; i++) {
        var category1 = new PostCategory_1.PostCategory();
        category1.name = "post category #1";
        var category2 = new PostCategory_1.PostCategory();
        category2.name = "post category #2";
        var post = new Post_1.Post();
        post.text = "Hello how are you?";
        post.title = "hello";
        post.categories.push(category1, category2);
        post.author = author;
        posts.push(post);
    }
    var qb = postRepository
        .createQueryBuilder("p")
        .leftJoinAndSelect("p.author", "author")
        .leftJoinAndSelect("p.categories", "categories")
        .skip(5)
        .take(10);
    Promise.all(posts.map(function (post) { return postRepository.save(post); }))
        .then(function (savedPosts) {
        console.log("Posts has been saved. Lets try to load some posts");
        return qb.getMany();
    })
        .then(function (loadedPost) {
        console.log("post loaded: ", loadedPost);
        console.log("now lets get total post count: ");
        return qb.getCount();
    })
        .then(function (totalCount) {
        console.log("total post count: ", totalCount);
        console.log("now lets try to load it with same repository method:");
        return postRepository.findAndCount();
    })
        .then(function (entitiesWithCount) {
        console.log("items: ", entitiesWithCount[0]);
        console.log("count: ", entitiesWithCount[1]);
    })
        .catch(function (error) { return console.log("Cannot save. Error: ", error.stack ? error.stack : error); });
}, function (error) { return console.log("Cannot connect: ", error.stack ? error.stack : error); });
//# sourceMappingURL=app.js.map