import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src/index"
import { Post } from "./entity/Post"
import { CustomNamingStrategy } from "./naming-strategy/CustomNamingStrategy"

const options: DataSourceOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    namingStrategy: new CustomNamingStrategy(),
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
            .then((post) => console.log("Post has been saved"))
            .catch((error) => console.log("Cannot save. Error: ", error))
    },
    (error) => console.log("Cannot connect: ", error),
)
