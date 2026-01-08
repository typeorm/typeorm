import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src"
import { Post } from "./entity/Post"
import { Author } from "./entity/Author"
import { Category } from "./entity/Category"

const options: DataSourceOptions = {
    type: "sqlite",
    database: "temp/sqlitedb.db",
    entityPrefix: "samples_", // pay attention on this prefix
    synchronize: true,
    logging: ["query", "error"],
    entities: [Post, Author, Category],
}

const dataSource = new DataSource(options)
dataSource
    .initialize()
    .then(async (dataSource) => {
        const category1 = new Category()
        category1.name = "Animals"

        const category2 = new Category()
        category2.name = "People"

        const author = new Author()
        author.firstName = "Umed"
        author.lastName = "Khudoiberdiev"

        const post = new Post()
        post.text = "Hello how are you?"
        post.title = "hello"
        post.author = author
        post.categories = [category1, category2]

        const postRepository = dataSource.getRepository(Post)

        await postRepository.save(post)
        console.log("Post has been saved")
    })
    .catch((error) => console.log("Error: ", error))
