import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../../src/data-source/DataSource"
import { setupSingleTestingConnection } from "../../../utils/test-utils"
import { Category } from "./entity/Category"
import { CategoryMetadata } from "./entity/CategoryMetadata"
import { Post } from "./entity/Post"

describe("persistence > custom-column-names", function () {
    let dataSource: DataSource
    before(async () => {
        const options = setupSingleTestingConnection("mysql", {
            entities: [Post, Category, CategoryMetadata],
        })
        if (!options) return

        dataSource = new DataSource(options)
    })
    after(() => dataSource?.destroy())

    function reloadDatabase() {
        if (!dataSource) return
        return dataSource.synchronize(true)
    }

    it("should attach exist entity to exist entity with many-to-one relation", async function () {
        if (!dataSource) return
        await reloadDatabase()

        const categoryRepository = dataSource.getRepository(Category)
        const postRepository = dataSource.getRepository(Post)

        const newCategory = categoryRepository.create()
        newCategory.name = "Animals"
        await categoryRepository.save(newCategory)

        const newPost = postRepository.create()
        newPost.title = "All about animals"
        await postRepository.save(newPost)

        newPost.category = newCategory
        await postRepository.save(newPost)

        const loadedPost = await postRepository.findOneOrFail({
            where: { id: 1 },
            relations: { category: true },
        })

        expect(loadedPost.category).not.to.be.undefined
        expect(loadedPost.categoryId).not.to.be.undefined
    })

    it("should attach new entity to exist entity with many-to-one relation", async function () {
        if (!dataSource) return
        await reloadDatabase()

        const categoryRepository = dataSource.getRepository(Category)
        const postRepository = dataSource.getRepository(Post)

        const newCategory = categoryRepository.create()
        newCategory.name = "Animals"
        await categoryRepository.save(newCategory)

        const newPost = postRepository.create()
        newPost.title = "All about animals"
        newPost.category = newCategory
        await postRepository.save(newPost)

        const loadedPost = await postRepository.findOneOrFail({
            where: { id: 1 },
            relations: { category: true },
        })

        expect(loadedPost.category).not.to.be.undefined
        expect(loadedPost.categoryId).not.to.be.undefined
    })

    it("should attach new entity to new entity with many-to-one relation", async function () {
        if (!dataSource) return
        await reloadDatabase()

        const categoryRepository = dataSource.getRepository(Category)
        const postRepository = dataSource.getRepository(Post)

        const newCategory = categoryRepository.create()
        newCategory.name = "Animals"
        const newPost = postRepository.create()
        newPost.title = "All about animals"
        newPost.category = newCategory
        await postRepository.save(newPost)

        const loadedPost = await postRepository.findOneOrFail({
            where: { id: 1 },
            relations: { category: true },
        })

        expect(loadedPost.category).not.to.be.undefined
        expect(loadedPost.categoryId).not.to.be.undefined
    })

    it("should attach exist entity to exist entity with one-to-one relation", async function () {
        if (!dataSource) return
        await reloadDatabase()

        const categoryRepository = dataSource.getRepository(Category)
        const postRepository = dataSource.getRepository(Post)
        const metadataRepository = dataSource.getRepository(CategoryMetadata)

        const newPost = postRepository.create()
        newPost.title = "All about animals"
        await postRepository.save(newPost)

        const newCategory = categoryRepository.create()
        newCategory.name = "Animals"
        await categoryRepository.save(newCategory)

        const newMetadata = metadataRepository.create()
        newMetadata.keyword = "animals"
        await metadataRepository.save(newMetadata)

        newCategory.metadata = newMetadata
        newPost.category = newCategory
        await postRepository.save(newPost)

        const loadedPost = await postRepository.findOneOrFail({
            where: { id: 1 },
            relations: { category: { metadata: true } },
        })

        expect(loadedPost.category).not.to.be.undefined
        expect(loadedPost.categoryId).not.to.be.undefined
        expect(loadedPost.category.metadata).not.to.be.undefined
        expect(loadedPost.category.metadataId).not.to.be.undefined
    })

    it("should attach new entity to exist entity with one-to-one relation", async function () {
        if (!dataSource) return
        await reloadDatabase()

        const categoryRepository = dataSource.getRepository(Category)
        const postRepository = dataSource.getRepository(Post)
        const metadataRepository = dataSource.getRepository(CategoryMetadata)

        const newPost = postRepository.create()
        newPost.title = "All about animals"
        await postRepository.save(newPost)

        const newMetadata = metadataRepository.create()
        newMetadata.keyword = "animals"
        const newCategory = categoryRepository.create()
        newCategory.name = "Animals"
        newCategory.metadata = newMetadata
        await categoryRepository.save(newCategory)

        newPost.category = newCategory
        await postRepository.save(newPost)

        const loadedPost = await postRepository.findOneOrFail({
            where: { id: 1 },
            relations: { category: { metadata: true } },
        })

        expect(loadedPost.category).not.to.be.undefined
        expect(loadedPost.categoryId).not.to.be.undefined
        expect(loadedPost.category.metadata).not.to.be.undefined
        expect(loadedPost.category.metadataId).not.to.be.undefined
    })
})
