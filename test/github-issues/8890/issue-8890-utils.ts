import "reflect-metadata"
import { EntityManager } from "../../../src"
import { Post } from "./entity/Post"
import { Author } from "./entity/Author"

export async function prepareData(manager: EntityManager) {
    const author1 = new Author()
    author1.id = 1
    author1.firstName = "Timber"
    author1.lastName = "Saw"
    author1.age = 25

    const author2 = new Author()
    author2.id = 2
    author2.firstName = "Bob"
    author2.lastName = "Miller"
    author2.age = 34

    const author3 = new Author()
    author3.id = 3
    author3.firstName = "Max"
    author3.lastName = "Newton"
    author3.age = 54

    await manager.save([author1, author2, author3])

    const post1 = new Post()
    post1.id = 1
    post1.title = "Post #1"
    post1.text = "About post #1"
    post1.author = author1

    const post2 = new Post()
    post2.id = 2
    post2.title = "Post #2"
    post2.text = "About post #2"

    const post3 = new Post()
    post3.id = 3
    post3.title = "Post #3"
    post3.text = "About post #3"

    const post4 = new Post()
    post4.id = 4
    post4.title = "Post #4"
    post4.text = "About post #4"
    post4.author = author2

    const post5 = new Post()
    post5.id = 5
    post5.title = "Post #5"
    post5.text = "About post #5"
    post5.author = author3

    await manager.save([post1, post2, post3, post4, post5])
}
