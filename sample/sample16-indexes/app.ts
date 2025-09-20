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

async function main() {
    const dataSource = new DataSource(options)

    try {
        await dataSource.initialize()

        const post = new Post()
        post.text = "Hello how are you?"
        post.title = "hello"
        post.likesCount = 0

        const postRepository = dataSource.getRepository(Post)

        try {
            await postRepository.save(post)
            console.log("Post has been saved")
        } catch (error) {
            console.log("Cannot save post: ", error)
        }
    } catch (error) {
        console.log("Cannot connect: ", error)
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy()
        }
    }
}

void main()
