import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../../src/data-source/DataSource"
import type { Repository } from "../../../../src/repository/Repository"
import { setupSingleTestingConnection } from "../../../utils/test-utils"
import { Category } from "./entity/Category"
import { CategoryMetadata } from "./entity/CategoryMetadata"
import { Post } from "./entity/Post"

describe("persistence > custom-column-names", function () {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    // connect to db
    let dataSource: DataSource
    const options = setupSingleTestingConnection("mysql", {
        entities: [Post, Category, CategoryMetadata],
    })

    beforeAll(async () => {
        dataSource = new DataSource(options!)
        await dataSource.initialize()
    })
    afterAll(() => dataSource.destroy())

    // clean up database before each test
    function reloadDatabase() {
        if (!dataSource) return
        return dataSource.synchronize(true).catch((e) => {
            throw e
        })
    }

    let postRepository: Repository<Post>
    let categoryRepository: Repository<Category>
    let metadataRepository: Repository<CategoryMetadata>
    beforeAll(function () {
        if (!dataSource) return
        postRepository = dataSource.getRepository(Post)
        categoryRepository = dataSource.getRepository(Category)
        metadataRepository = dataSource.getRepository(CategoryMetadata)
    })

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    describe.skipIf(!options)(
        "attach exist entity to exist entity with many-to-one relation",
        function () {
            let newPost: Post, newCategory: Category, loadedPost: Post

            beforeAll(reloadDatabase)

            // save a new category
            beforeAll(() => {
                newCategory = categoryRepository.create()
                newCategory.name = "Animals"
                return categoryRepository.save(newCategory)
            })

            // save a new post
            beforeAll(() => {
                newPost = postRepository.create()
                newPost.title = "All about animals"
                return postRepository.save(newPost)
            })

            // attach category to post and save it
            beforeAll(() => {
                newPost.category = newCategory
                return postRepository.save(newPost)
            })

            // load a post
            beforeAll(async () => {
                const post = await postRepository.findOne({
                    where: {
                        id: 1,
                    },
                    relations: {
                        category: true,
                    },
                })
                loadedPost = post!
            })

            it("should contain attached category", function () {
                expect(loadedPost).not.to.be.undefined
                expect(loadedPost.category).not.to.be.undefined
                expect(loadedPost.categoryId).not.to.be.undefined
            })
        },
    )

    describe.skipIf(!options)(
        "attach new entity to exist entity with many-to-one relation",
        function () {
            let newPost: Post, newCategory: Category, loadedPost: Post

            beforeAll(reloadDatabase)

            // save a new category
            beforeAll(() => {
                newCategory = categoryRepository.create()
                newCategory.name = "Animals"
                return categoryRepository.save(newCategory)
            })

            // save a new post and attach category
            beforeAll(() => {
                newPost = postRepository.create()
                newPost.title = "All about animals"
                newPost.category = newCategory
                return postRepository.save(newPost)
            })

            // load a post
            beforeAll(async () => {
                const post = await postRepository.findOne({
                    where: {
                        id: 1,
                    },
                    relations: {
                        category: true,
                    },
                })
                loadedPost = post!
            })

            it("should contain attached category", function () {
                expect(loadedPost).not.to.be.undefined
                expect(loadedPost.category).not.to.be.undefined
                expect(loadedPost.categoryId).not.to.be.undefined
            })
        },
    )

    describe.skipIf(!options)(
        "attach new entity to new entity with many-to-one relation",
        function () {
            let newPost: Post, newCategory: Category, loadedPost: Post

            beforeAll(reloadDatabase)

            // save a new category, post and attach category to post
            beforeAll(() => {
                newCategory = categoryRepository.create()
                newCategory.name = "Animals"
                newPost = postRepository.create()
                newPost.title = "All about animals"
                newPost.category = newCategory
                return postRepository.save(newPost)
            })

            // load a post
            beforeAll(async () => {
                const post = await postRepository.findOne({
                    where: {
                        id: 1,
                    },
                    relations: {
                        category: true,
                    },
                })
                loadedPost = post!
            })

            it("should contain attached category", function () {
                expect(loadedPost).not.to.be.undefined
                expect(loadedPost.category).not.to.be.undefined
                expect(loadedPost.categoryId).not.to.be.undefined
            })
        },
    )

    describe.skipIf(!options)(
        "attach exist entity to exist entity with one-to-one relation",
        function () {
            let newPost: Post,
                newCategory: Category,
                newMetadata: CategoryMetadata,
                loadedPost: Post

            beforeAll(reloadDatabase)

            // save a new post
            beforeAll(() => {
                newPost = postRepository.create()
                newPost.title = "All about animals"
                return postRepository.save(newPost)
            })

            // save a new category
            beforeAll(() => {
                newCategory = categoryRepository.create()
                newCategory.name = "Animals"
                return categoryRepository.save(newCategory)
            })

            // save a new metadata
            beforeAll(() => {
                newMetadata = metadataRepository.create()
                newMetadata.keyword = "animals"
                return metadataRepository.save(newMetadata)
            })

            // attach metadata to category and category to post and save it
            beforeAll(() => {
                newCategory.metadata = newMetadata
                newPost.category = newCategory
                return postRepository.save(newPost)
            })

            // load a post
            beforeAll(async () => {
                const post = await postRepository.findOne({
                    where: {
                        id: 1,
                    },
                    relations: {
                        category: {
                            metadata: true,
                        },
                    },
                })
                loadedPost = post!
            })

            it("should contain attached category and metadata in the category", function () {
                expect(loadedPost).not.to.be.undefined
                expect(loadedPost.category).not.to.be.undefined
                expect(loadedPost.categoryId).not.to.be.undefined
                expect(loadedPost.category.metadata).not.to.be.undefined
                expect(loadedPost.category.metadataId).not.to.be.undefined
            })
        },
    )

    describe.skipIf(!options)(
        "attach new entity to exist entity with one-to-one relation",
        function () {
            let newPost: Post,
                newCategory: Category,
                newMetadata: CategoryMetadata,
                loadedPost: Post

            beforeAll(reloadDatabase)

            // save a new post
            beforeAll(() => {
                newPost = postRepository.create()
                newPost.title = "All about animals"
                return postRepository.save(newPost)
            })

            // save a new category and new metadata
            beforeAll(() => {
                newMetadata = metadataRepository.create()
                newMetadata.keyword = "animals"
                newCategory = categoryRepository.create()
                newCategory.name = "Animals"
                newCategory.metadata = newMetadata
                return categoryRepository.save(newCategory)
            })

            // attach metadata to category and category to post and save it
            beforeAll(() => {
                newPost.category = newCategory
                return postRepository.save(newPost)
            })

            // load a post
            beforeAll(async () => {
                const post = await postRepository.findOne({
                    where: {
                        id: 1,
                    },
                    relations: {
                        category: {
                            metadata: true,
                        },
                    },
                })
                loadedPost = post!
            })

            it("should contain attached category and metadata in the category", function () {
                expect(loadedPost).not.to.be.undefined
                expect(loadedPost.category).not.to.be.undefined
                expect(loadedPost.categoryId).not.to.be.undefined
                expect(loadedPost.category.metadata).not.to.be.undefined
                expect(loadedPost.category.metadataId).not.to.be.undefined
            })
        },
    )
})
