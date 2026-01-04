import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src"
import { Post } from "./entity/Post"
import { PostCategory } from "./entity/PostCategory"
import { PostAuthor } from "./entity/PostAuthor"

const options: DataSourceOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    synchronize: true,
    entities: [__dirname + "/entity/*"],
    subscribers: [__dirname + "/subscriber/*"],
}

const dataSource = new DataSource(options)
dataSource.initialize().then(
    (dataSource) => {
        const category1 = new PostCategory()
        category1.name = "post category #1"

        const category2 = new PostCategory()
        category2.name = "post category #2"

        const author = new PostAuthor()
        author.name = "Umed"

        const post = new Post()
        post.text = "Hello how are you?"
        post.title = "hello"
        post.categories.push(category1, category2)
        post.author = author

        const postRepository = dataSource.getRepository(Post)

        postRepository
            .save(post)
            .then((post) => {
                console.log("Post has been saved")
                console.log("---------------------------")
                return postRepository.findOneBy({ id: post.id })
            })
            .then((loadedPost) => {
                console.log("post is loaded. Its uid is " + loadedPost!.uid)
                console.log("Lets now load it with relations.")
                console.log("---------------------------")
                return postRepository
                    .createQueryBuilder("p")
                    .leftJoinAndSelect("p.author", "author")
                    .leftJoinAndSelect("p.categories", "categories")
                    .where("p.id = :id", { id: loadedPost!.id })
                    .getOne()
            })
            .then((loadedPost) => {
                console.log("load finished. Now lets update entity")
                console.log("---------------------------")
                loadedPost!.text = "post updated"
                loadedPost!.author.name = "Bakha"
                return postRepository.save(loadedPost!)
            })
            .then((loadedPost) => {
                console.log("update finished. Now lets remove entity")
                console.log("---------------------------")
                return postRepository.remove(loadedPost)
            })
            .then(() => {
                console.log("post removed.")
            })
            .catch((error) =>
                console.log(
                    "Cannot save. Error: ",
                    error.stack ? error.stack : error,
                ),
            )
    },
    (error) =>
        console.log("Cannot connect: ", error.stack ? error.stack : error),
)
