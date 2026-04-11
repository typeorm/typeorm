import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"

describe("persistence > orphanage > delete > many-to-one", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should delete the orphaned entity when orphanedRowAction is on @ManyToOne", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const categoryRepository = dataSource.getRepository(Category)
                const postRepository = dataSource.getRepository(Post)

                const category = await categoryRepository.save(
                    new Category("all-posts"),
                )
                category.posts = [new Post(), new Post()]
                await categoryRepository.save(category)

                const loaded = (await categoryRepository.findOneBy({
                    id: category.id,
                }))!
                loaded.posts = category.posts.filter((p) => p.id === 1)
                await categoryRepository.save(loaded)

                expect(loaded.posts).to.have.lengthOf(1)
                expect(loaded.posts[0].id).to.equal(1)

                const postCount = await postRepository.count()
                expect(postCount).to.equal(1)

                const postsWithoutForeignKeys = (
                    await postRepository.find()
                ).filter((p) => !p.categoryId)
                expect(postsWithoutForeignKeys).to.have.lengthOf(0)
            }),
        ))
})
