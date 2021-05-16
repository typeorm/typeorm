import "reflect-metadata";
import {ConnectionOptions, createConnection} from "../../src/index";
import {Post} from "./entity/Post";
import {Author} from "./entity/Author";

const options: ConnectionOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    logging: ["query", "error"],
    entities: [Post, Author],
};

createConnection(options).then(async connection => {

    // first insert all the data
    let author = new Author();
    author.firstName = "Umed";
    author.lastName = "Khudoiberdiev";

    let post = new Post();
    post.title = "hello";
    post.author = author;

    let postRepository = connection.getRepository(Post);

    await postRepository.save(post);
    console.log("Database schema was created and data has been inserted into the database.");

    // close connection now
    await connection.close();

    // now create a new connection
    connection = await createConnection({
        type: "mysql",
        name: "mysql",
        host: "localhost",
        port: 3306,
        username: "test",
        password: "test",
        database: "test",
        logging: ["query", "error"],
        entities: [
            Post,
            Author
        ],
        migrations: [
            __dirname + "/migrations/*{.js,.ts}"
        ]
    });

    // run all migrations
    await connection.runMigrations();

    // and undo migrations two times (because we have two migrations)
    await connection.undoLastMigration();
    await connection.undoLastMigration();

    console.log("Done. We run two migrations then reverted them.");

}).catch(error => console.log("Error: ", error));
