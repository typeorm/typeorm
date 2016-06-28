import "reflect-metadata";
import {createConnection, CreateConnectionOptions} from "../../src/backend";
import {Post} from "./entity/Post";
import {PostCategory} from "./entity/PostCategory";
import {PostAuthor} from "./entity/PostAuthor";
import {EverythingSubscriber} from "./subscriber/EverythingSubscriber";

// first create a connection
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
    entities: [Post, PostAuthor, PostCategory],
    subscribers: [EverythingSubscriber]
};

createConnection(options).then(connection => {

    let category1 = new PostCategory();
    category1.name = "post category #1";

    let category2 = new PostCategory();
    category2.name = "post category #2";
    
    let author = new PostAuthor();
    author.name = "Umed";

    let post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.categories.push(category1, category2);
    post.author = author;

    let postRepository = connection.getRepository(Post);

    postRepository
        .persist(post)
        .then(post => {
            console.log("Post has been saved");
            return postRepository.findOneById(post.id);
        })
        .then(loadedPost => {
            console.log("---------------------------");
            console.log("post is loaded. Lets now load it with relations.");
            return postRepository
                .createQueryBuilder("p")
                .leftJoinAndSelect("p.author", "author")
                .leftJoinAndSelect("p.categories", "categories")
                .where("p.id = :id", { id: loadedPost.id })
                .getSingleResult();
        })
        .then(loadedPost => {
            console.log("---------------------------");
            console.log("load finished. Now lets update entity");
            loadedPost.text = "post updated";
            loadedPost.author.name = "Bakha";
            return postRepository.persist(loadedPost);
        })
        .then(loadedPost => {
            console.log("---------------------------");
            console.log("update finished. Now lets remove entity");
            return postRepository.remove(loadedPost);
        })
        .then(loadedPost => {
            console.log("---------------------------");
            console.log("post removed.");
        })
        .catch(error => console.log("Cannot save. Error: ", error.stack ? error.stack : error));

}, error => console.log("Cannot connect: ", error.stack ? error.stack : error));