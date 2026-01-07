import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src"
import { Post } from "./entity/Post"
import { PostAuthor } from "./entity/PostAuthor"

const options: DataSourceOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    entities: [Post, PostAuthor],
}

const dataSource = new DataSource(options)
dataSource.initialize().then(
    (dataSource) => {
        const author = new PostAuthor()
        author.name = "Umed"

        const post = new Post()
        post.text = "Hello how are you?"
        post.title = "hello"
        post.author = author

        const postRepository = dataSource.getRepository(Post)

        postRepository
            .save(post)
            .then(() => console.log("Post has been saved"))
            .catch((error) => console.log("Cannot save. Error: ", error))
    },
    (error) => console.log("Cannot connect: ", error),
)
