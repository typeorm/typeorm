import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src"
import { Post } from "./entity/Post"
import { PostDetails } from "./entity/PostDetails"
import { Image } from "./entity/Image"
import { Cover } from "./entity/Cover"
import { Category } from "./entity/Category"

const options: DataSourceOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    entities: [__dirname + "/entity/*"],
}

const dataSource = new DataSource(options)
dataSource
    .initialize()
    .then((dataSource) => {
        const postRepository = dataSource.getRepository(Post)

        const postCover = new Cover()
        postCover.url = "http://covers.com/post.jpg"

        const details = new PostDetails()
        details.meta = "hello"
        details.comment = "wow"

        const category1 = new Category()
        category1.description = "about post1"

        const category2 = new Category()
        category2.description = "about post2"

        const image = new Image()
        image.name = "post.jpg"

        const post = new Post()
        post.title = "Hello post"
        post.text = "Hello world of post#1"
        post.cover = postCover
        post.details = details
        post.images.push(image)
        post.categories = [category1, category2]

        postRepository
            .save(post)
            .then((result) => console.log(result))
            .catch((error) => console.log(error.stack ? error.stack : error))
    })
    .catch((error) => console.log(error.stack ? error.stack : error))
