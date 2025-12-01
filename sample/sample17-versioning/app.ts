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

async function main() {
    const dataSource = new DataSource(options)

    try {
        await dataSource.initialize()

        const post = new Post()
        post.text = "Hello how are you?"
        post.title = "hello"

        const postRepository = dataSource.getRepository(Post)

        await postRepository.save(post)

        console.log(`Post has been saved: `, post)
        console.log(
            `Post's version is ${post.version}. Lets change post's text and update it:`,
        )
        post.title = "updating title"

        await postRepository.save(post)
        console.log(`Post has been updated. Post's version is ${post.version}`)
    } catch (error) {
        console.log("Cannot connect: ", error)
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy()
        }
    }
}

void main()
