import "reflect-metadata";
import { ConnectionOptions, createConnection } from "../../src/index";
import { User, Post2 } from "./entity/Post";

const options: ConnectionOptions = {
    type: "mongodb",
    host: "localhost",
    database: "test",
    logging: ["query", "error"],
    // synchronize: true,
    entities: [User]
};
const options2: ConnectionOptions = {
    type: "mysql",
    host: "192.168.0.12",
    port: 3309,
    database: "wallet",
    username: "root",
    password: "123456",
    logging: ["query", "error"],
    // synchronize: true,
    entities: [Post2]
};
createConnection(options).then(async connection => {

    const post = new User();
    post.nickName = "Hello how are you?";


    await connection.getRepository(User).save(post);
    console.log("Post has been saved: ", post);
    await connection.manager.findOne(User)
    const loadedPost = await connection.getRepository(User).findOne({
        nickName: "Hello how are you?",
    });
    console.log("Post has been loaded: ", loadedPost);

    // take last 5 of saved posts
    const allPosts = await connection.getRepository(User).find({ take: 5 });
    console.log("All posts: ", allPosts);

    // perform mongodb-specific query using cursor which returns properly initialized entities
    const cursor1 = connection.getMongoRepository(User).createEntityCursor({ nickName: "hello" });
    console.log("Post retrieved via cursor #1: ", await cursor1.next());
    console.log("Post retrieved via cursor #2: ", await cursor1.next());

    // we can also perform mongodb-specific queries using mongodb-specific entity manager
    const cursor2 = connection.mongoManager.createEntityCursor(User, { nickName: "hello" });
    console.log("Only two posts retrieved via cursor: ", await cursor2.limit(2).toArray());

}, error => {
    console.log("Error: ", error)
});
