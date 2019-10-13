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
    var category1 = new Category_1.Category();
    category1.name = "category #1";
    var category2 = new Category_1.Category();
    category2.name = "category #2";
    var post = new Post_1.Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.categories = [category1, category2];
    var author = new Author_1.Author();
    author.name = "Umed";
    post.author = author;
    var author2 = new Author_1.Author();
    author2.name = "Bakhrom";
    postRepository
        .save(post)
        .then(function (post) {
        return postRepository
            .createQueryBuilder("post")
            .leftJoin("post.categories", "categories")
            .leftJoin("categories.author", "author")
            .where("post.id=1")
            .getOne();
    })
        .then(function (loadedPost) {
        console.log("loadedPosts: ", loadedPost);
        console.log("Lets update a post - add a new category and change author");
        var category3 = new Category_1.Category();
        category3.name = "category #3";
        post.categories.push(category3);
        post.author = author2;
        return postRepository.save(post);
    })
        .then(function (updatedPost) {
        return postRepository
            .createQueryBuilder("post")
            .leftJoinAndSelect("post.author", "author")
            .leftJoinAndSelect("post.categories", "categories")
            .where("post.id=:id", { id: post.id })
            .getOne();
    })
        .then(function (loadedPost) {
        console.log(loadedPost);
        console.log("Lets update a post - return old author back:");
        console.log("updating with: ", author);
        loadedPost.title = "Umed's post";
        loadedPost.author = author;
        return postRepository.save(loadedPost);
    })
        .then(function (updatedPost) {
        return postRepository
            .createQueryBuilder("post")
            .leftJoinAndSelect("post.author", "author")
            .leftJoinAndSelect("post.categories", "categories")
            .where("post.id=:id", { id: post.id })
            .getOne();
    })
        .then(function (loadedPost) {
        console.log(loadedPost);
        console.log("Now lets remove post's author:");
        post.author = null;
        return postRepository.save(post);
    })
        .then(function (updatedPost) {
        return postRepository
            .createQueryBuilder("post")
            .leftJoinAndSelect("post.author", "author")
            .leftJoinAndSelect("post.categories", "categories")
            .where("post.id=:id", { id: post.id })
            .getOne();
    })
        .then(function (loadedPost) {
        console.log(loadedPost);
        console.log("Finally bakhrom's post:");
        post.author = author2;
        return postRepository.save(post);
    })
        .then(function (updatedPost) {
        return postRepository
            .createQueryBuilder("post")
            .leftJoinAndSelect("post.author", "author")
            .leftJoinAndSelect("post.categories", "categories")
            .where("post.id=:id", { id: post.id })
            .getOne();
    })
        .then(function (loadedPost) {
        console.log(loadedPost);
    })
        .catch(function (error) { return console.log(error.stack); });
}, function (error) { return console.log("Cannot connect: ", error); });
//# sourceMappingURL=app.js.map