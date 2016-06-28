import "reflect-metadata";
import {createConnection, CreateConnectionOptions} from "../../src/backend";
import {Post} from "./entity/Post";

const options: CreateConnectionOptions = {
    driver: "mysql",
    connection: {
        host: "192.168.99.100",
        port: 3306,
        username: "root",
        password: "admin",
        database: "test",
        autoSchemaCreate: true
    },
    entities: [Post]
};
/*const options: CreateConnectionOptions = {
    driver: "postgres",
    connection: {
        host: "192.168.99.100",
        port: 5432,
        username: "test",
        password: "admin",
        database: "test",
        autoSchemaCreate: true,
        logging: {
            logQueries: true
        }
    },
    entities: [Post]
};*/

createConnection(options).then(connection => {

    let post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.likesCount = 100;

    let postRepository = connection.getRepository(Post);

    postRepository
        .persist(post)
        .then(post => console.log("Post has been saved"))
        .catch(error => console.log("Cannot save. Error: ", error));

}, error => console.log("Cannot connect: ", error));