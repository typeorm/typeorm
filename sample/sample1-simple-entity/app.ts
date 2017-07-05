import "reflect-metadata";
import {createConnection, ConnectionOptions} from "../../src/index";
import {Post} from "./entity/Post";

const options: ConnectionOptions = {
    // type: "oracle",
    // host: "localhost",
    // username: "system",
    // password: "oracle",
    // port: 1521,
    // sid: "xe.oracle.docker",
    // "name": "mysql",
    // "type": "mysql",
    // "host": "localhost",
    // "port": 3306,
    // "username": "test",
    // "password": "test",
    // "database": "test",
    // type: "postgres",
    // host: "localhost",
    // port: 5432,
    // username: "test",
    // password: "test",
    // database: "test",
    "type": "mssql",
    "host": "192.168.1.6",
    "username": "sa",
    "password": "admin12345",
    "database": "test",
    // port: 1521,
    // type: "sqlite",
    // database: "temp/sqlitedb.db",
    logging: {
        logQueries: true,
        logFailedQueryError: false,
        logSchemaCreation: true
    },
    autoSchemaSync: true,
    entities: [Post]
};

createConnection(options).then(connection => {

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
