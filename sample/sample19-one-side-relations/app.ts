import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src"
import { Post } from "./entity/Post"
import { Author } from "./entity/Author"
import { Category } from "./entity/Category"
import { PostMetadata } from "./entity/PostMetadata"

const options: DataSourceOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [Post, Author, Category, PostMetadata],
}

const dataSource = new DataSource(options)
dataSource.initialize().then(
    (dataSource) => {
        const postRepository = dataSource.getRepository(Post)
        const authorRepository = dataSource.getRepository(Author)
        const categoryRepository = dataSource.getRepository(Category)
        const metadataRepository = dataSource.getRepository(PostMetadata)

        const category1 = categoryRepository.create()
        category1.name = "Hello category1"

        const category2 = categoryRepository.create()
        category2.name = "Bye category2"

        const author = authorRepository.create()
        author.name = "Umed"

        const metadata = metadataRepository.create()
        metadata.comment = "Metadata about post"

        const post = postRepository.create()
        post.text = "Hello how are you?"
        post.title = "hello"
        post.author = author
        post.metadata = metadata
        post.categories = [category1, category2]

        postRepository
            .save(post)
            .then((post) => {
                console.log("Post has been saved.")
                console.log(post)

                console.log("Now lets load posts with all their relations:")
                return postRepository.find({
                    join: {
                        alias: "post",
                        leftJoinAndSelect: {
                            author: "post.author",
                            metadata: "post.metadata",
                            categories: "post.categories",
                        },
                    },
                })
            })
            .then((post) => {
                console.log("Loaded posts: ", post)
            })
            .catch((error) => console.log(error.stack))
    },
    (error) => console.log("Cannot connect: ", error),
)
