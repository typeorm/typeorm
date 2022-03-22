import "reflect-metadata"
import { DataSourceOptions, createConnection } from "../../src/index"
import { Post } from "./entity/Post"

const options: DataSourceOptions = {
    name: "sap",
    type: "sap",
    host: "192.168.56.102",
    port: 39015,
    username: "SYSTEM",
    password: "MySuperHanaPwd123!",
    database: "HXE",
    logging: true,
    synchronize: true,
    entities: [Post],
}

createConnection(options).then(
    async (connection) => {
        let post = new Post()
        post.text = "Hello how are you?"
        post.title = "hello"
        post.likesCount = 100

        let postRepository = connection.getRepository(Post)

        postRepository
            .save(post)
            .then((post) => console.log("Post has been saved: ", post))
            .catch((error) => console.log("Cannot save. Error: ", error))
    },
    (error) => console.log("Cannot connect: ", error),
)
