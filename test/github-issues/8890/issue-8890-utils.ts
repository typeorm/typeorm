import "reflect-metadata"
import { EntityManager } from "../../../src"
import { Post } from "./entity/Post"
import { Author } from "./entity/Author"

export async function prepareData(manager: EntityManager) {
    const post1 = new Post()
    post1.id = 1
    post1.title = "Post #1"
    post1.text = "About post #1"
    await manager.save(post1)

    const post2 = new Post()
    post2.id = 2
    post2.title = "Post #2"
    post2.text = "About post #2"
    await manager.save(post2)

    const post3 = new Post()
    post3.id = 3
    post3.title = "Post #3"
    post3.text = "About post #3"
    await manager.save(post3)

    const author1 = new Author()
    author1.id = 1
    author1.firstName = "Timber"
    author1.lastName = "Saw"
    author1.age = 25
    author1.posts = [post1]
    await manager.save(author1)
}
