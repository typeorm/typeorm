import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"

describe("persistence > delete orphans", () => {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    // connect to db
    let connections: DataSource[] = []

    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("removing a Post from a Category", () =>
        Promise.all(
            connections.map(async (connection) => {
                const categoryRepository = connection.getRepository(Category)
                const postRepository = connection.getRepository(Post)

                const categoryToInsert = await categoryRepository.save(
                    new Category(),
                )
                categoryToInsert.posts = [new Post(), new Post()]

                await categoryRepository.save(categoryToInsert)
                const categoryId = categoryToInsert.id

                // Keep the first post
                const categoryToUpdate = (await categoryRepository.findOneBy({
                    id: categoryId,
                }))!
                categoryToUpdate.posts = categoryToInsert.posts.filter(
                    (p) => p.id === 1,
                )
                await categoryRepository.save(categoryToUpdate)

                // should retain a Post on the Category
                const category = await categoryRepository.findOneBy({
                    id: categoryId,
                })
                expect(category).not.to.be.null
                expect(category!.posts).to.have.lengthOf(1)
                expect(category!.posts[0].id).to.equal(1)

                // should mark orphaned Post as soft-deleted
                const postCount = await postRepository.count()
                expect(postCount).to.equal(1)
                const postCountIncludeDeleted = await postRepository.count({
                    withDeleted: true,
                })
                expect(postCountIncludeDeleted).to.equal(2)

                // should retain foreign keys on remaining Posts
                const postsWithoutForeignKeys = (
                    await postRepository.find()
                ).filter((p) => !p.categoryId)
                expect(postsWithoutForeignKeys).to.have.lengthOf(0)
            }),
        ))
})
