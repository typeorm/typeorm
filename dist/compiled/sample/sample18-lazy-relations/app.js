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
    var authorRepository = connection.getRepository(Author_1.Author);
    var categoryRepository = connection.getRepository(Category_1.Category);
    var author = authorRepository.create();
    author.name = "Umed";
    var post = postRepository.create();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.author = author.asPromise();
    // same as: post.author = Promise.resolve(author);
    postRepository
        .save(post)
        .then(function (post) {
        console.log("Post has been saved. Lets save post from inverse side.");
        console.log(post);
        var secondPost = postRepository.create();
        secondPost.text = "Second post";
        secondPost.title = "About second post";
        author.posts = Promise.resolve([secondPost]);
        return authorRepository.save(author);
    })
        .then(function (author) {
        console.log("Author with a new post has been saved. Lets try to update post in the author");
        return author.posts.then(function (posts) {
            posts[0].title = "should be updated second post";
            return authorRepository.save(author);
        });
    })
        .then(function (updatedAuthor) {
        console.log("Author has been updated: ", updatedAuthor);
        console.log("Now lets load all posts with their authors:");
        return postRepository.find({ join: { alias: "post", leftJoinAndSelect: { author: "post.author" } } });
    })
        .then(function (posts) {
        console.log("Posts are loaded: ", posts);
        console.log("Now lets delete a post");
        posts[0].author = Promise.resolve(null);
        posts[1].author = Promise.resolve(null);
        return postRepository.save(posts[0]);
    })
        .then(function (posts) {
        console.log("Two post's author has been removed.");
        console.log("Now lets check many-to-many relations");
        var category1 = categoryRepository.create();
        category1.name = "Hello category1";
        var category2 = categoryRepository.create();
        category2.name = "Bye category2";
        var post = postRepository.create();
        post.title = "Post & Categories";
        post.text = "Post with many categories";
        post.categories = Promise.resolve([
            category1,
            category2
        ]);
        return postRepository.save(post);
    })
        .then(function (posts) {
        console.log("Post has been saved with its categories. ");
        console.log("Lets find it now. ");
        return postRepository.find({ join: { alias: "post", innerJoinAndSelect: { categories: "post.categories" } } });
    })
        .then(function (posts) {
        console.log("Post with categories are loaded: ", posts);
        console.log("Lets remove one of the categories: ");
        return posts[0].categories.then(function (categories) {
            categories.splice(0, 1);
            // console.log(posts[0]);
            return postRepository.save(posts[0]);
        });
    })
        .then(function (posts) {
        console.log("One of the post category has been removed.");
    })
        .catch(function (error) { return console.log(error.stack); });
}, function (error) { return console.log("Cannot connect: ", error); });
//# sourceMappingURL=app.js.map