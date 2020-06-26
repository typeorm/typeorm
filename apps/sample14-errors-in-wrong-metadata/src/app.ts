import "reflect-metadata";
import { ConnectionOptions, createConnection } from "@typeorm/core";
import { Post } from "./entity/Post";
import { PostAuthor } from "./entity/PostAuthor";

const options: ConnectionOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    entities: [Post, PostAuthor]
};

createConnection(options).then(connection => {

    const author = new PostAuthor();
    author.name = "Umed";

    const post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.author = author;

    const postRepository = connection.getRepository(Post);

    postRepository
        .save(post)
        .then(post => console.log("Post has been saved"))
        .catch(error => console.log("Cannot save. Error: ", error));

}, error => console.log("Cannot connect: ", error));
