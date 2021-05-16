import "reflect-metadata";
import {ConnectionOptions, createConnection} from "../../src/index";
import {Post} from "./entity/Post";

const options: ConnectionOptions = {
    type: "mongodb",
    host: "localhost",
    database: "test",
    logging: ["query", "error"],
    // synchronize: true,
    entities: [Post]
};

createConnection(options).then(async connection => {

    const post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.likesCount = 100;

    await connection.getRepository(Post).save(post);
    console.log("Post has been saved: ", post);

    const loadedPost = await connection.getRepository(Post).findOne({
        text: "Hello how are you?",
    });
    console.log("Post has been loaded: ", loadedPost);

    // take last 5 of saved posts
    const allPosts = await connection.getRepository(Post).find({ take: 5 });
    console.log("All posts: ", allPosts);

    // perform mongodb-specific query using cursor which returns properly initialized entities
    const cursor1 = connection.getMongoRepository(Post).createEntityCursor({ title: "hello" });
    console.log("Post retrieved via cursor #1: ", await cursor1.next());
    console.log("Post retrieved via cursor #2: ", await cursor1.next());

    // we can also perform mongodb-specific queries using mongodb-specific entity manager
    const cursor2 = connection.mongoManager.createEntityCursor(Post, { title: "hello" });
    console.log("Only two posts retrieved via cursor: ", await cursor2.limit(2).toArray());

}, error => console.log("Error: ", error));
