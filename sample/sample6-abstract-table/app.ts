import "reflect-metadata";
import {ConnectionOptions, createConnection} from "../../src/index";
import {Post} from "./entity/Post";
import {PostCategory} from "./entity/PostCategory";
import {PostAuthor} from "./entity/PostAuthor";
import {Blog} from "./entity/Blog";

const options: ConnectionOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    entities: [__dirname + "/entity/*"]
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
    post.author = author;
    post.categories.push(category1, category2);

    /*category1 = new PostCategory();
    category1.name = "post category #1";

    category2 = new PostCategory();
    category2.name = "post category #2";

    author = new PostAuthor();
    author.name = "Umed";*/

    let blog = new Blog();
    blog.text = "Hello how are you?";
    blog.title = "hello";
    blog.author = author;
    blog.categories.push(category1, category2);

    let postRepository = connection.getRepository(Post);
    let blogRepository = connection.getRepository(Blog);

    postRepository
        .save(post)
        .then(post => {
            console.log("Post has been saved");
            return postRepository.findOne(post.id);
        })
        .then(loadedPost => {
            console.log("post is loaded: ", loadedPost);
            return blogRepository.save(blog);
        })
        .then(blog => {
            console.log("Blog has been saved");
            return blogRepository.findOne(blog.id);
        })
        .then(loadedBlog => {
            console.log("blog is loaded: ", loadedBlog);
            return blogRepository.save(blog);
        })
        .catch(error => console.log("Cannot save. Error: ", error.stack ? error.stack : error));

}, error => console.log("Cannot connect: ", error.stack ? error.stack : error));
