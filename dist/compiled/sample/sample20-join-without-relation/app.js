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
    var entityManager = connection.manager;
    var postRepository = connection.getRepository(Post_1.Post);
    var authorRepository = connection.getRepository(Author_1.Author);
    var categoryRepository = connection.getRepository(Category_1.Category);
    var category1 = categoryRepository.create();
    category1.name = "Hello category1";
    var category2 = categoryRepository.create();
    category2.name = "Bye category2";
    var author = authorRepository.create();
    author.name = "Umed";
    var post = postRepository.create();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.authorId = 1;
    // post.author = author;
    post.categories = [category1, category2];
    Promise.all([
        authorRepository.save(author),
        categoryRepository.save(category1),
        categoryRepository.save(category2),
    ])
        .then(function () {
        return postRepository.save(post);
    })
        .then(function () {
        console.log("Everything has been saved.");
    })
        .then(function () {
        return postRepository
            .createQueryBuilder("post")
            .leftJoinAndMapMany("post.superCategories", "post.categories", "categories")
            .leftJoinAndMapOne("post.author", Author_1.Author, "author", "author.id=post.authorId")
            .getMany();
    }).then(function (posts) {
        console.log("Loaded posts: ", posts);
        return entityManager
            .createQueryBuilder(Author_1.Author, "author")
            .getMany();
    }).then(function (authors) {
        console.log("Loaded authors: ", authors);
    })
        /*    posts[0].title = "should be updated second post";

        return author.posts.then(posts => {
                return authorRepository.save(author);
            });
        })
        .then(updatedAuthor => {
            console.log("Author has been updated: ", updatedAuthor);
            console.log("Now lets load all posts with their authors:");
            return postRepository.find({ alias: "post", leftJoinAndSelect: { author: "post.author" } });
        })
        .then(posts => {
            console.log("Posts are loaded: ", posts);
            console.log("Now lets delete a post");
            posts[0].author = Promise.resolve(null);
            posts[1].author = Promise.resolve(null);
            return postRepository.save(posts[0]);
        })
        .then(posts => {
            console.log("Two post's author has been removed.");
            console.log("Now lets check many-to-many relations");
            
            let category1 = categoryRepository.create();
            category1.name = "Hello category1";
            
            let category2 = categoryRepository.create();
            category2.name = "Bye category2";
            
            let post = postRepository.create();
            post.title = "Post & Categories";
            post.text = "Post with many categories";
            post.categories = Promise.resolve([
                category1,
                category2
            ]);
            
            return postRepository.save(post);
        })
        .then(posts => {
            console.log("Post has been saved with its categories. ");
            console.log("Lets find it now. ");
            return postRepository.find({ alias: "post", innerJoinAndSelect: { categories: "post.categories" } });
        })
        .then(posts => {
            console.log("Post with categories are loaded: ", posts);
            console.log("Lets remove one of the categories: ");
            return posts[0].categories.then(categories => {
                categories.splice(0, 1);
                // console.log(posts[0]);
                return postRepository.save(posts[0]);
            });
        })*/
        .then(function (posts) {
        // console.log("One of the post category has been removed.");
    })
        .catch(function (error) { return console.log(error.stack); });
}, function (error) { return console.log("Cannot connect: ", error); });
//# sourceMappingURL=app.js.map