import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src"
import { Post } from "./entity/Post"
import { Author } from "./entity/Author"
import { Category } from "./entity/Category"

const options: DataSourceOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [Post, Author, Category],
}

const dataSource = new DataSource(options)
dataSource.initialize().then(
    (dataSource) => {
        const entityManager = dataSource.manager

        const postRepository = dataSource.getRepository(Post)
        const authorRepository = dataSource.getRepository(Author)
        const categoryRepository = dataSource.getRepository(Category)

        const category1 = categoryRepository.create()
        category1.name = "Hello category1"

        const category2 = categoryRepository.create()
        category2.name = "Bye category2"

        const author = authorRepository.create()
        author.name = "Umed"

        const post = postRepository.create()
        post.text = "Hello how are you?"
        post.title = "hello"
        post.authorId = 1
        post.categories = [category1, category2]

        Promise.all<any>([
            authorRepository.save(author),
            categoryRepository.save(category1),
            categoryRepository.save(category2),
        ])
            .then(() => {
                return postRepository.save(post)
            })
            .then(() => {
                console.log("Everything has been saved.")
            })
            .then(() => {
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndMapMany(
                        "post.superCategories",
                        "post.categories",
                        "categories",
                    )
                    .leftJoinAndMapOne(
                        "post.author",
                        Author,
                        "author",
                        "author.id=post.authorId",
                    )
                    .getMany()
            })
            .then((posts) => {
                console.log("Loaded posts: ", posts)

                return entityManager
                    .createQueryBuilder(Author, "author")
                    .getMany()
            })
            .then((authors) => {
                console.log("Loaded authors: ", authors)
            })
            .catch((error) => console.log(error.stack))
    },
    (error) => console.log("Cannot connect: ", error),
)
