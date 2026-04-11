import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Category } from "./entity/Category"
import { CategoryMetadata } from "./entity/CategoryMetadata"
import { Post } from "./entity/Post"

describe("persistence > custom-column-names", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post, Category, CategoryMetadata],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should attach exist entity to exist entity with many-to-one relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const newCategory = dataSource.manager.create(Category)
                newCategory.name = "Animals"
                await dataSource.manager.save(newCategory)

                const newPost = dataSource.manager.create(Post)
                newPost.title = "All about animals"
                await dataSource.manager.save(newPost)

                newPost.category = newCategory
                await dataSource.manager.save(newPost)

                const loadedPost = await dataSource.manager.findOneOrFail(
                    Post,
                    { where: { id: 1 }, relations: { category: true } },
                )

                expect(loadedPost.category).not.to.be.undefined
                expect(loadedPost.categoryId).not.to.be.undefined
            }),
        ))

    it("should attach new entity to exist entity with many-to-one relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const newCategory = dataSource.manager.create(Category)
                newCategory.name = "Animals"
                await dataSource.manager.save(newCategory)

                const newPost = dataSource.manager.create(Post)
                newPost.title = "All about animals"
                newPost.category = newCategory
                await dataSource.manager.save(newPost)

                const loadedPost = await dataSource.manager.findOneOrFail(
                    Post,
                    { where: { id: 1 }, relations: { category: true } },
                )

                expect(loadedPost.category).not.to.be.undefined
                expect(loadedPost.categoryId).not.to.be.undefined
            }),
        ))

    it("should attach new entity to new entity with many-to-one relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const newCategory = dataSource.manager.create(Category)
                newCategory.name = "Animals"
                const newPost = dataSource.manager.create(Post)
                newPost.title = "All about animals"
                newPost.category = newCategory
                await dataSource.manager.save(newPost)

                const loadedPost = await dataSource.manager.findOneOrFail(
                    Post,
                    { where: { id: 1 }, relations: { category: true } },
                )

                expect(loadedPost.category).not.to.be.undefined
                expect(loadedPost.categoryId).not.to.be.undefined
            }),
        ))

    it("should attach exist entity to exist entity with one-to-one relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const newPost = dataSource.manager.create(Post)
                newPost.title = "All about animals"
                await dataSource.manager.save(newPost)

                const newCategory = dataSource.manager.create(Category)
                newCategory.name = "Animals"
                await dataSource.manager.save(newCategory)

                const newMetadata = dataSource.manager.create(CategoryMetadata)
                newMetadata.keyword = "animals"
                await dataSource.manager.save(newMetadata)

                newCategory.metadata = newMetadata
                newPost.category = newCategory
                await dataSource.manager.save(newPost)

                const loadedPost = await dataSource.manager.findOneOrFail(
                    Post,
                    {
                        where: { id: 1 },
                        relations: { category: { metadata: true } },
                    },
                )

                expect(loadedPost.category).not.to.be.undefined
                expect(loadedPost.categoryId).not.to.be.undefined
                expect(loadedPost.category.metadata).not.to.be.undefined
                expect(loadedPost.category.metadataId).not.to.be.undefined
            }),
        ))

    it("should attach new entity to exist entity with one-to-one relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const newPost = dataSource.manager.create(Post)
                newPost.title = "All about animals"
                await dataSource.manager.save(newPost)

                const newMetadata = dataSource.manager.create(CategoryMetadata)
                newMetadata.keyword = "animals"
                const newCategory = dataSource.manager.create(Category)
                newCategory.name = "Animals"
                newCategory.metadata = newMetadata
                await dataSource.manager.save(newCategory)

                newPost.category = newCategory
                await dataSource.manager.save(newPost)

                const loadedPost = await dataSource.manager.findOneOrFail(
                    Post,
                    {
                        where: { id: 1 },
                        relations: { category: { metadata: true } },
                    },
                )

                expect(loadedPost.category).not.to.be.undefined
                expect(loadedPost.categoryId).not.to.be.undefined
                expect(loadedPost.category.metadata).not.to.be.undefined
                expect(loadedPost.category.metadataId).not.to.be.undefined
            }),
        ))
})
