import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src"
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
    async (dataSource) => {
        const postRepository = dataSource.getRepository(Post)

        const post = new Post()
        post.id = 1
        post.type = "person"
        post.text = "this is test post!"

        console.log("saving the post: ")
        await postRepository.save(post)
        console.log("Post has been saved: ", post)

        console.log("now loading the post: ")
        const loadedPost = await postRepository.findOneBy({
            id: 1,
            type: "person",
        })
        console.log("loaded post: ", loadedPost)
    },
    (error) => console.log("Error: ", error),
)
