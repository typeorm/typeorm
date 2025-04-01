import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src/index"
import { Post } from "./entity/Post"

const options: DataSourceOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [Post],
}

const dataSource = new DataSource(options)
dataSource.initialize().then(
    (dataSource) => {
        const post = new Post()
        post.text = "Hello how are you?"
        post.title = "hello"

        const postRepository = dataSource.getRepository(Post)

        postRepository
            .save(post)
            .then((post) => {
                console.log(`Post has been saved: `, post)
                console.log(
                    `Post's version is ${post.version}. Lets change post's text and update it:`,
                )
                post.title = "updating title"
                return postRepository.save(post)
            })
            .then((post) => {
                console.log(
                    `Post has been updated. Post's version is ${post.version}`,
                )
            })
    },
    (error) => console.log("Cannot connect: ", error),
)
