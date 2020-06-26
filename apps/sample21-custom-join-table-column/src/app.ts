import "reflect-metadata";
import { ConnectionOptions, createConnection } from "@typeorm/core";
import { Post } from "./entity/Post";
import { Author } from "./entity/Author";
import { Category } from "./entity/Category";

const options: ConnectionOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [Post, Author, Category]
};

createConnection(options).then(connection => {

    const postRepository = connection.getRepository(Post);

    const author = new Author();
    author.name = "Umed";

    const category1 = new Category();
    category1.name = "Category #1";

    const category2 = new Category();
    category2.name = "Category #2";

    const post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.author = author;
    post.categories = [category1, category2];

    postRepository
        .save(post)
        .then(post => {
            console.log("Post has been saved. Lets load it now.");
            return postRepository.find({
                join: {
                    alias: "post",
                    leftJoinAndSelect: {
                        categories: "post.categories",
                        author: "post.user" // note that table column is used, not object property
                    }
                }
            });
        })
        .then(loadedPosts => {
            console.log("loadedPosts: ", loadedPosts);
        })
        .catch(error => console.log(error.stack));

}, error => console.log("Cannot connect: ", error));
