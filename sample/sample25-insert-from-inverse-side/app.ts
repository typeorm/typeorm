import "reflect-metadata";
import {createConnection, CreateConnectionOptions} from "../../src/backend";
import {Post} from "./entity/Post";
import {Author} from "./entity/Author";

const options: CreateConnectionOptions = {
    driver: "mysql",
    connection: {
        host: "192.168.99.100",
        port: 3306,
        username: "root",
        password: "admin",
        database: "test",
        autoSchemaCreate: true,
        logging: {
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        }
    },
    entities: [Post, Author]
};

createConnection(options).then(connection => {

    let postRepository = connection.getRepository(Post);
    let authorRepository = connection.getRepository(Author);

    const authorPromise = authorRepository.findOneById(1).then(author => {
        if (!author) {
            author = new Author();
            author.name = "Umed";
            return authorRepository.persist(author).then(savedAuthor => {
                return authorRepository.findOneById(1);
            });
        }
        return author;
    });

    const postPromise = postRepository.findOneById(1).then(post => {
        if (!post) {
            post = new Post();
            post.title = "Hello post";
            post.text = "This is post contents";
            return postRepository.persist(post).then(savedPost => {
                return postRepository.findOneById(1);
            });
        }
        return post;
    });

    return Promise.all<any>([authorPromise, postPromise])
        .then(results => {
            const [author, post] = results;
            author.posts = [post];
            return authorRepository.persist(author);
        })
        .then(savedAuthor => {
            console.log("Author has been saved: ", savedAuthor);
        })
        .catch(error => console.log(error.stack));

}, error => console.log("Cannot connect: ", error));