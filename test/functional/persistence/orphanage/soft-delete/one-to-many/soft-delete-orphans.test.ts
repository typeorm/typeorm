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

    async function seedCategory(dataSource: DataSource) {
        const categoryRepo = dataSource.getRepository(Category)
        const category = new Category()
        category.posts = [new Post(), new Post()]
        await categoryRepo.save(category)
        return category
    }

    it("should not touch children when relation is not loaded", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const categoryRepo = dataSource.getRepository(Category)
                const postRepo = dataSource.getRepository(Post)

                const category = await seedCategory(dataSource)

                const loaded = await categoryRepo.findOneByOrFail({
                    id: category.id,
                })
                expect(loaded.posts).to.be.undefined
                await categoryRepo.save(loaded)

                expect(await postRepo.count()).to.equal(2)
                expect(await postRepo.count({ withDeleted: true })).to.equal(2)
            }),
        ))

    it("should not touch children when relation is loaded but not modified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const categoryRepo = dataSource.getRepository(Category)
                const postRepo = dataSource.getRepository(Post)

                const category = await seedCategory(dataSource)

                const loaded = await categoryRepo.findOneOrFail({
                    where: { id: category.id },
                    relations: { posts: true },
                })
                expect(loaded.posts).to.have.lengthOf(2)

                await categoryRepo.save(loaded)

                expect(await postRepo.count()).to.equal(2)
                expect(await postRepo.count({ withDeleted: true })).to.equal(2)
            }),
        ))

    it("should soft-delete orphaned children when relation is loaded and modified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const categoryRepo = dataSource.getRepository(Category)
                const postRepo = dataSource.getRepository(Post)

                const category = await seedCategory(dataSource)

                const loaded = await categoryRepo.findOneOrFail({
                    where: { id: category.id },
                    relations: { posts: true },
                })
                loaded.posts = loaded.posts.filter((p) => p.id === 1)
                await categoryRepo.save(loaded)

                expect(await postRepo.count()).to.equal(1)
                expect(await postRepo.count({ withDeleted: true })).to.equal(2)

                const posts = await postRepo.find()
                const withoutFK = posts.filter((p) => !p.categoryId)
                expect(withoutFK).to.have.lengthOf(0)
            }),
        ))
})
