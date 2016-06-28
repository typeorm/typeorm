import "reflect-metadata";
import {CreateConnectionOptions, createConnection} from "../../src/backend";
import {Post} from "./entity/Post";
import {PostDetails} from "./entity/PostDetails";
import {PostCategory} from "./entity/PostCategory";
import {PostMetadata} from "./entity/PostMetadata";
import {PostImage} from "./entity/PostImage";
import {PostInformation} from "./entity/PostInformation";
import {PostAuthor} from "./entity/PostAuthor";

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
    entities: [Post, PostDetails, PostCategory, PostMetadata, PostImage, PostInformation, PostAuthor]
};

createConnection(options).then(connection => {
    let details = new PostDetails();
    details.authorName = "Umed";
    details.comment = "about post";
    details.metadata = "post,details,one-to-one";

    let post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.details = details;

    let postRepository = connection.getRepository(Post);

    postRepository
        .persist(post)
        .then(post => console.log("Post has been saved"))
        .catch(error => console.log("Cannot save. Error: ", error));

}, error => console.log("Cannot connect: ", error));