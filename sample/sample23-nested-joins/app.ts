import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src/index"
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
        const postRepository = dataSource.getRepository(Post)

        const category1 = new Category()
        category1.name = "category #1"

        const category2 = new Category()
        category2.name = "category #2"

        const post = new Post()
        post.text = "Hello how are you?"
        post.title = "hello"
        post.categories = [category1, category2]

        const author = new Author()
        author.name = "Umed"
        post.author = author

        const author2 = new Author()
        author2.name = "Bakhrom"

        postRepository
            .save(post)
            .then((post) => {
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoin("post.categories", "categories")
                    .leftJoin("categories.author", "author")
                    .where("post.id=1")
                    .getOne()
            })
            .then((loadedPost) => {
                console.log("loadedPosts: ", loadedPost)
                console.log(
                    "Lets update a post - add a new category and change author",
                )

                const category3 = new Category()
                category3.name = "category #3"
                post.categories.push(category3)

                post.author = author2

                return postRepository.save(post)
            })
            .then((updatedPost) => {
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.author", "author")
                    .leftJoinAndSelect("post.categories", "categories")
                    .where("post.id=:id", { id: post.id })
                    .getOne()
            })
            .then((loadedPost) => {
                console.log(loadedPost)
                console.log("Lets update a post - return old author back:")

                console.log("updating with: ", author)
                loadedPost!.title = "Umed's post"
                loadedPost!.author = author
                return postRepository.save(loadedPost!)
            })
            .then((updatedPost) => {
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.author", "author")
                    .leftJoinAndSelect("post.categories", "categories")
                    .where("post.id=:id", { id: post.id })
                    .getOne()
            })
            .then((loadedPost) => {
                console.log(loadedPost)
                console.log("Now lets remove post's author:")
                post.author = null
                return postRepository.save(post)
            })
            .then((updatedPost) => {
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.author", "author")
                    .leftJoinAndSelect("post.categories", "categories")
                    .where("post.id=:id", { id: post.id })
                    .getOne()
            })
            .then((loadedPost) => {
                console.log(loadedPost)
                console.log("Finally bakhrom's post:")
                post.author = author2
                return postRepository.save(post)
            })
            .then((updatedPost) => {
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.author", "author")
                    .leftJoinAndSelect("post.categories", "categories")
                    .where("post.id=:id", { id: post.id })
                    .getOne()
            })
            .then((loadedPost) => {
                console.log(loadedPost)
            })
            .catch((error) => console.log(error.stack))
    },
    (error) => console.log("Cannot connect: ", error),
)
