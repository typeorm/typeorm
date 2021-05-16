import "reflect-metadata";
import {ConnectionOptions, createConnection} from "../../src/index";
import {Post} from "./entity/Post";
import {PostDetails} from "./entity/PostDetails";
import {PostCategory} from "./entity/PostCategory";
import {PostMetadata} from "./entity/PostMetadata";
import {PostImage} from "./entity/PostImage";
import {PostInformation} from "./entity/PostInformation";
import {PostAuthor} from "./entity/PostAuthor";

const options: ConnectionOptions = {
    // type: "mssql",
    // host: "192.168.1.10",
    // username: "sa",
    // password: "admin12345",
    // database: "test",
    type: "oracle",
    host: "localhost",
    username: "system",
    password: "oracle",
    port: 1521,
    sid: "xe.oracle.docker",
    synchronize: true,
    logging: ["query", "error"],
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
        .save(post)
        .then(post => console.log("Post has been saved"))
        .catch(error => console.log("Cannot save. Error: ", error));

}).catch(error => console.log("Error: ", error));
