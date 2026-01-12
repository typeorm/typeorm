import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src"
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

async function main() {
    const dataSource = new DataSource(options)

    try {
        await dataSource.initialize()
    } catch (error) {
        console.log("Cannot connect: ", error)
        return
    }

    const post = new Post()
    post.text = "Hello how are you?"
    post.title = "hello"
    post.likesCount = 100

    const postRepository = dataSource.getRepository(Post)

    try {
        await postRepository.save(post)
        console.log("Post has been saved: ", post)
    } catch (error) {
        console.log("Cannot save. Error: ", error)
    }

    await dataSource.destroy()
}

void main()
