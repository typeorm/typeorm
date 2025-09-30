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
        const authorRepository = dataSource.getRepository(Author)
        const categoryRepository = dataSource.getRepository(Category)

        const author = authorRepository.create()
        author.name = "Umed"

        const post = postRepository.create()
        post.text = "Hello how are you?"
        post.title = "hello"
        post.author = author.asPromise()
        // same as: post.author = Promise.resolve(author);

        postRepository
            .save(post)
            .then((post) => {
                console.log(
                    "Post has been saved. Lets save post from inverse side.",
                )
                console.log(post)

                const secondPost = postRepository.create()
                secondPost.text = "Second post"
                secondPost.title = "About second post"
                author.posts = Promise.resolve([secondPost])

                return authorRepository.save(author)
            })
            .then((author: any) => {
                // temporary
                console.log(
                    "Author with a new post has been saved. Lets try to update post in the author",
                )

                return author.posts!.then((posts: any) => {
                    // temporary
                    posts![0]!.title = "should be updated second post"
                    return authorRepository.save(author!)
                })
            })
            .then((updatedAuthor) => {
                console.log("Author has been updated: ", updatedAuthor)
                console.log("Now lets load all posts with their authors:")
                return postRepository.find({
                    join: {
                        alias: "post",
                        leftJoinAndSelect: { author: "post.author" },
                    },
                })
            })
            .then((posts) => {
                console.log("Posts are loaded: ", posts)
                console.log("Now lets delete a post")
                posts[0].author = Promise.resolve(null)
                posts[1].author = Promise.resolve(null)
                return postRepository.save(posts[0])
            })
            .then((posts) => {
                console.log("Two post's author has been removed.")
                console.log("Now lets check many-to-many relations")

                const category1 = categoryRepository.create()
                category1.name = "Hello category1"

                const category2 = categoryRepository.create()
                category2.name = "Bye category2"

                const post = postRepository.create()
                post.title = "Post & Categories"
                post.text = "Post with many categories"
                post.categories = Promise.resolve([category1, category2])

                return postRepository.save(post)
            })
            .then((posts) => {
                console.log("Post has been saved with its categories. ")
                console.log("Lets find it now. ")
                return postRepository.find({
                    join: {
                        alias: "post",
                        innerJoinAndSelect: { categories: "post.categories" },
                    },
                })
            })
            .then((posts) => {
                console.log("Post with categories are loaded: ", posts)
                console.log("Lets remove one of the categories: ")
                return posts[0].categories.then((categories: any) => {
                    // temporary
                    categories!.splice(0, 1)
                    // console.log(posts[0]);
                    return postRepository.save(posts[0])
                })
            })
            .then((posts) => {
                console.log("One of the post category has been removed.")
            })
            .catch((error) => console.log(error.stack))
    },
    (error) => console.log("Cannot connect: ", error),
)
