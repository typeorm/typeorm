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

describe("persistence > orphanage > soft-delete > one-to-many", () => {
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

    it("should soft-delete the orphaned entity when orphanedRowAction is on @OneToMany", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const categoryRepo = dataSource.getRepository(Category)
                const postRepo = dataSource.getRepository(Post)

                const category = new Category()
                category.posts = [new Post(), new Post()]
                await categoryRepo.save(category)

                const loaded = await categoryRepo.findOneByOrFail({
                    id: category.id,
                })
                loaded.posts = category.posts.filter((p) => p.id === 1)
                await categoryRepo.save(loaded)

                // Only one post should be visible (the other is soft-deleted)
                const postCount = await postRepo.count()
                expect(postCount).to.equal(1)

                // Both should exist when including soft-deleted
                const allCount = await postRepo.count({ withDeleted: true })
                expect(allCount).to.equal(2)

                // FK should be retained on remaining post
                const posts = await postRepo.find()
                const postsWithoutFK = posts.filter((p) => !p.categoryId)
                expect(postsWithoutFK).to.have.lengthOf(0)
            }),
        ))
})
