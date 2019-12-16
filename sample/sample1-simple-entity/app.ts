import "reflect-metadata";
import {ConnectionOptions, createConnection} from "../../src/index";
import {Post} from "./entity/Post";

const options: ConnectionOptions = {
    // type: "oracle",
    // host: "localhost",
    // username: "system",
    // password: "oracle",
    // port: 1521,
    // sid: "xe.oracle.docker",
    "name": "sap",
    "type": "sap",
    "host": "192.168.56.101",
    "port": 39015,
    "username": "SYSTEM",
    "password": "MySuperHanaPwd123!",
    "database": "HXE",
    "logging": true,
    // type: "postgres",
    // host: "localhost",
    // port: 5432,
    // username: "test",
    // password: "test",
    // database: "test",
    // "type": "mssql",
    // "host": "192.168.1.6",
    // "username": "sa",
    // "password": "admin12345",
    // "database": "test",
    // port: 1521,
    // type: "sqlite",
    // database: "temp/sqlitedb.db",
    // logger: "file",
    // logging: ["query", "error"],
    // logging: ["error", "schema", "query"],
    // maxQueryExecutionTime: 90,
    synchronize: true,
    entities: [Post]
};

createConnection(options).then(async connection => {

    // const posts: Post[] = [];
    // for (let i = 0; i < 100; i++) {
    //     let post = new Post();
    //     post.text = "Hello how are you?";
    //     post.title = "hello";
    //     post.likesCount = 100;
    //     posts.push(post);
    // }
    //
    // await connection.manager.save(posts);

    // try {
    //     await connection.query("CREATE DATABASE 'aaaa' AND DIE");
    //
    // } catch (err) {
    //     console.log("-------------------------------");
    //     console.log("ERRROR: ", err instanceof QueryFailedError);
    //     console.log(err);
    // }

    let post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.likesCount = 100;

    let postRepository = connection.getRepository(Post);

    postRepository
        .save(post)
        .then(post => console.log("Post has been saved: ", post))
        .catch(error => console.log("Cannot save. Error: ", error));

}, error => console.log("Cannot connect: ", error));
