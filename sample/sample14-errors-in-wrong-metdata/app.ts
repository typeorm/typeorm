import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src/index"
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
        let author = new PostAuthor()
        author.name = "Umed"

        let post = new Post()
        post.text = "Hello how are you?"
        post.title = "hello"
        post.author = author

        let postRepository = dataSource.getRepository(Post)

        postRepository
            .save(post)
            .then((post) => console.log("Post has been saved"))
            .catch((error) => console.log("Cannot save. Error: ", error))
    },
    (error) => console.log("Cannot connect: ", error),
)
