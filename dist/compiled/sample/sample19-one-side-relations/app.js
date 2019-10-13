"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var index_1 = require("../../src/index");
var Post_1 = require("./entity/Post");
var Author_1 = require("./entity/Author");
var Category_1 = require("./entity/Category");
var PostMetadata_1 = require("./entity/PostMetadata");
var options = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [Post_1.Post, Author_1.Author, Category_1.Category, PostMetadata_1.PostMetadata]
};
index_1.createConnection(options).then(function (connection) {
    var postRepository = connection.getRepository(Post_1.Post);
    var authorRepository = connection.getRepository(Author_1.Author);
    var categoryRepository = connection.getRepository(Category_1.Category);
    var metadataRepository = connection.getRepository(PostMetadata_1.PostMetadata);
    var category1 = categoryRepository.create();
    category1.name = "Hello category1";
    var category2 = categoryRepository.create();
    category2.name = "Bye category2";
    var author = authorRepository.create();
    author.name = "Umed";
    var metadata = metadataRepository.create();
    metadata.comment = "Metadata about post";
    var post = postRepository.create();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.author = author;
    post.metadata = metadata;
    post.categories = [category1, category2];
    postRepository
        .save(post)
        .then(function (post) {
        console.log("Post has been saved.");
        console.log(post);
        console.log("Now lets load posts with all their relations:");
        return postRepository.find({
            join: {
                alias: "post",
                leftJoinAndSelect: {
                    author: "post.author",
                    metadata: "post.metadata",
                    categories: "post.categories"
                }
            }
        });
        // let secondPost = postRepository.create();
        // secondPost.text = "Second post";
        // secondPost.title = "About second post";
        // return authorRepository.save(author);
    }).then(function (post) {
        console.log("Loaded posts: ", post);
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