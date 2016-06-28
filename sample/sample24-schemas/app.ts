import "reflect-metadata";
import {createConnection, CreateConnectionOptions} from "../../src/backend";
import {Post} from "./entity/Post";

// NOTE: this example is not working yet, only concepts of how this feature must work described here

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
    // entitySchemaDirectories: [__dirname + "/schemas"],
    entitySchemas: [
        require(__dirname + "/../../../../sample/sample24-schemas/schemas/post.json"),
        require(__dirname + "/../../../../sample/sample24-schemas/schemas/post-details.json"),
        require(__dirname + "/../../../../sample/sample24-schemas/schemas/category.json"),
        require(__dirname + "/../../../../sample/sample24-schemas/schemas/image.json")
    ]
};

createConnection(options).then(connection => {
    let postRepository = connection.getRepository<Post>("Post");

    let post: Post = {
        title: "Hello post",
        text: "I am virtual post!",
        details: {
            metadata: "#post,#virtual",
            comment: "it all about a post"
        },
        images: [],
        secondaryImages: [],
        categories: []
    };
    
    postRepository
        .persist(post)
        .then(result => {
            console.log(result);
        })
        .catch(error => console.log(error.stack ? error.stack : error));

}).catch(error => console.log(error.stack ? error.stack : error));