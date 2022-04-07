import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src/index"
import { Post } from "./entity/Post"
import { BasePost } from "./entity/BasePost"

const options: DataSourceOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [Post, BasePost],
}

const dataSource = new DataSource(options)
dataSource.initialize().then(
    (dataSource) => {
        let post = new Post()
        post.text = "Hello how are you?"
        post.title = "hello"
        post.likesCount = 0

        let postRepository = dataSource.getRepository(Post)

        postRepository
            .save(post)
            .then((post) => console.log("Post has been saved"))
    },
    (error) => console.log("Cannot connect: ", error),
)
