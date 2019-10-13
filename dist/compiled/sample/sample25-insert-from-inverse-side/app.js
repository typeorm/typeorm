"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var Author_1 = require("./entity/Author");
var options = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [Post_1.Post, Author_1.Author]
};
index_1.createConnection(options).then(function (connection) {
    var postRepository = connection.getRepository(Post_1.Post);
    var authorRepository = connection.getRepository(Author_1.Author);
    var authorPromise = authorRepository.findOne(1).then(function (author) {
        if (!author) {
            author = new Author_1.Author();
            author.name = "Umed";
            return authorRepository.save(author).then(function (savedAuthor) {
                return authorRepository.findOne(1);
            });
        }
        return author;
    });
    var postPromise = postRepository.findOne(1).then(function (post) {
        if (!post) {
            post = new Post_1.Post();
            post.title = "Hello post";
            post.text = "This is post contents";
            return postRepository.save(post).then(function (savedPost) {
                return postRepository.findOne(1);
            });
        }
        return post;
    });
    return Promise.all([authorPromise, postPromise])
        .then(function (results) {
        var _a = tslib_1.__read(results, 2), author = _a[0], post = _a[1];
        author.posts = [post];
        return authorRepository.save(author);
    })
        .then(function (savedAuthor) {
        console.log("Author has been saved: ", savedAuthor);
    })
        .catch(function (error) { return console.log(error.stack); });
}, function (error) { return console.log("Cannot connect: ", error); });
//# sourceMappingURL=app.js.map