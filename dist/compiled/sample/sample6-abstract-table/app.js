"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var PostCategory_1 = require("./entity/PostCategory");
var PostAuthor_1 = require("./entity/PostAuthor");
var Blog_1 = require("./entity/Blog");
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
    var category1 = new PostCategory_1.PostCategory();
    category1.name = "post category #1";
    var category2 = new PostCategory_1.PostCategory();
    category2.name = "post category #2";
    var author = new PostAuthor_1.PostAuthor();
    author.name = "Umed";
    var post = new Post_1.Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.author = author;
    post.categories.push(category1, category2);
    /*category1 = new PostCategory();
    category1.name = "post category #1";

    category2 = new PostCategory();
    category2.name = "post category #2";

    author = new PostAuthor();
    author.name = "Umed";*/
    var blog = new Blog_1.Blog();
    blog.text = "Hello how are you?";
    blog.title = "hello";
    blog.author = author;
    blog.categories.push(category1, category2);
    var postRepository = connection.getRepository(Post_1.Post);
    var blogRepository = connection.getRepository(Blog_1.Blog);
    postRepository
        .save(post)
        .then(function (post) {
        console.log("Post has been saved");
        return postRepository.findOne(post.id);
    })
        .then(function (loadedPost) {
        console.log("post is loaded: ", loadedPost);
        return blogRepository.save(blog);
    })
        .then(function (blog) {
        console.log("Blog has been saved");
        return blogRepository.findOne(blog.id);
    })
        .then(function (loadedBlog) {
        console.log("blog is loaded: ", loadedBlog);
        return blogRepository.save(blog);
    })
        .catch(function (error) { return console.log("Cannot save. Error: ", error.stack ? error.stack : error); });
}, function (error) { return console.log("Cannot connect: ", error.stack ? error.stack : error); });
//# sourceMappingURL=app.js.map