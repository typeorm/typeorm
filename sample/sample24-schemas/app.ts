import "reflect-metadata";
import {ConnectionOptions, createConnection, EntitySchema} from "../../src";
import {Post} from "./entity/Post";
import {PostDetails} from "./entity/PostDetails";
import {Category} from "./entity/Category";
import {Image} from "./entity/Image";

// NOTE: this example is not working yet, only concepts of how this feature must work described here

const PostEntity = new EntitySchema<Post>(require(__dirname + "/../../../../sample/sample24-schemas/schemas/post.json"));
const PostDetailsEntity = new EntitySchema<PostDetails>(require(__dirname + "/../../../../sample/sample24-schemas/schemas/post-details.json"));
const CategoryEntity = new EntitySchema<Category>(require(__dirname + "/../../../../sample/sample24-schemas/schemas/category.json"));
const ImageEntity = new EntitySchema<Image>(require(__dirname + "/../../../../sample/sample24-schemas/schemas/image.json"));

const options: ConnectionOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    // entitySchemaDirectories: [__dirname + "/schemas"],
    entities: [
        PostEntity,
        PostDetailsEntity,
        CategoryEntity,
        ImageEntity,
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
        .save(post)
        .then(result => {
            console.log(result);
        })
        .catch(error => console.log(error.stack ? error.stack : error));

}).catch(error => console.log(error.stack ? error.stack : error));
