import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src/index"
import { Post } from "./entity/Post"
import { PostDetails } from "./entity/PostDetails"

const options: DataSourceOptions = {
    type: "mssql",
    host: "192.168.1.10",
    username: "sa",
    password: "admin12345",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [__dirname + "/entity/*"],
}

const dataSource = new DataSource(options)
dataSource.initialize().then(
    (dataSource) => {
        const details1 = new PostDetails()
        details1.comment = "People"

        const details2 = new PostDetails()
        details2.comment = "Human"

        const post = new Post()
        post.text = "Hello how are you?"
        post.title = "hello"
        post.details = [details1, details2]

        const postRepository = dataSource.getRepository(Post)

        postRepository
            .save(post)
            .then((post) => console.log("Post has been saved"))
            .catch((error) => console.log("Cannot save. Error: ", error))
    },
    (error) => console.log("Cannot connect: ", error),
)
