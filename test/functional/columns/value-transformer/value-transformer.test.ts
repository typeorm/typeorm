import "reflect-metadata"

import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

import { DataSource } from "../../../../src/data-source/DataSource"
import { PhoneBook } from "./entity/PhoneBook"
import { Complex, Post } from "./entity/Post"
import { User } from "./entity/User"
import { Category } from "./entity/Category"
import { View } from "./entity/View"
import {
    CountingTransformer,
    DefaultWithTransformer,
} from "./entity/DefaultWithTransformer"
import { expect } from "chai"

describe("columns > value-transformer functionality", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post, PhoneBook, User, Category, View],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should marshal data using the provided value-transformer", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // create and save a post first
                const post = new Post()
                post.title = "About columns"
                post.tags = ["simple", "transformer"]
                await postRepository.save(post)

                // then update all its properties and save again
                post.title = "About columns1"
                post.tags = ["very", "simple"]
                await postRepository.save(post)

                // check if all columns are updated except for readonly columns
                const loadedPost = await postRepository.findOneBy({
                    id: post.id,
                })
                expect(loadedPost!.title).to.be.equal("About columns1")
                expect(loadedPost!.tags).to.deep.eq(["very", "simple"])

                const phoneBookRepository = connection.getRepository(PhoneBook)
                const phoneBook = new PhoneBook()
                phoneBook.name = "George"
                phoneBook.phones = new Map()
                phoneBook.phones.set("work", 123456)
                phoneBook.phones.set("mobile", 1234567)
                await phoneBookRepository.save(phoneBook)

                const loadedPhoneBook = await phoneBookRepository.findOneBy({
                    id: phoneBook.id,
                })
                expect(loadedPhoneBook!.name).to.be.equal("George")
                expect(loadedPhoneBook!.phones).not.to.be.undefined
                expect(loadedPhoneBook!.phones.get("work")).to.equal(123456)
                expect(loadedPhoneBook!.phones.get("mobile")).to.equal(1234567)
            }),
        ))

    it("should apply three transformers in the right order", () =>
        Promise.all(
            connections.map(async (connection) => {
                const userRepository = connection.getRepository(User)
                const email = `${connection.name}@JOHN.doe`
                const user = new User()
                user.email = email

                await userRepository.save(user)

                const dbUser = await userRepository.findOneBy({ id: user.id })
                expect(dbUser!.email).to.equal(email.toLocaleLowerCase())
            }),
        ))

    it("should apply all the transformers", () =>
        Promise.all(
            connections.map(async (connection) => {
                const categoryRepository = connection.getRepository(Category)
                const description = `  ${connection.name}-DESCRIPTION   `
                const category = new Category()
                category.description = description

                await categoryRepository.save(category)

                const dbCategory = await categoryRepository.findOneBy({
                    id: category.id,
                })
                expect(dbCategory!.description).to.equal(
                    description.toLocaleLowerCase().trim(),
                )
            }),
        ))

    it("should apply no transformer", () =>
        Promise.all(
            connections.map(async (connection) => {
                const viewRepository = connection.getRepository(View)
                const title = `${connection.name}`
                const view = new View()
                view.title = title

                await viewRepository.save(view)

                const dbView = await viewRepository.findOneBy({ id: view.id })
                expect(dbView!.title).to.equal(title)
            }),
        ))

    it("should marshal data using a complex value-transformer", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // create and save a post first
                const post = new Post()
                post.title = "Complex transformers!"
                post.tags = ["complex", "transformer"]
                await postRepository.save(post)

                let loadedPost = await postRepository.findOneBy({ id: post.id })
                expect(loadedPost!.complex).to.eq(null)

                // then update all its properties and save again
                post.title = "Complex transformers2!"
                post.tags = ["very", "complex", "actually"]
                post.complex = new Complex("3 2.5")
                await postRepository.save(post)

                // check if all columns are updated except for readonly columns
                loadedPost = await postRepository.findOneBy({ id: post.id })
                expect(loadedPost!.title).to.be.equal("Complex transformers2!")
                expect(loadedPost!.tags).to.deep.eq([
                    "very",
                    "complex",
                    "actually",
                ])
                expect(loadedPost!.complex!.x).to.eq(3)
                expect(loadedPost!.complex!.y).to.eq(2.5)

                // then update all its properties and save again
                post.title = "Complex transformers3!"
                post.tags = ["very", "lacking", "actually"]
                post.complex = null
                await postRepository.save(post)

                loadedPost = await postRepository.findOneBy({ id: post.id })
                expect(loadedPost!.complex).to.eq(null)

                // then update all its properties and save again
                post.title = "Complex transformers4!"
                post.tags = ["very", "here", "again!"]
                post.complex = new Complex("0.5 0.5")
                await postRepository.save(post)

                loadedPost = await postRepository.findOneBy({ id: post.id })
                expect(loadedPost!.complex!.x).to.eq(0.5)
                expect(loadedPost!.complex!.y).to.eq(0.5)

                // then update all its properties and save again
                post.title = "Complex transformers5!"
                post.tags = ["now", "really", "lacking!"]
                post.complex = new Complex("1.05 2.3")
                await postRepository.save(post)

                loadedPost = await postRepository.findOneBy({ id: post.id })
                expect(loadedPost!.complex!.x).to.eq(1.05)
                expect(loadedPost!.complex!.y).to.eq(2.3)
            }),
        ))
})

describe("columns > value-transformer > default value should not trigger double transformation", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [DefaultWithTransformer],
                schemaCreate: true,
                dropSchema: true,
                // The problem occurs in databases which do NOT support RETURNING statement
                // and require a SELECT to reload entity after INSERT
                enabledDrivers: ["mysql"],
            })),
    )

    beforeEach(async () => {
        CountingTransformer.reset()
        await reloadTestingDatabases(connections)
    })

    after(() => closeTestingConnections(connections))

    it("should use default value and apply transformer correctly when column is not set", async () => {
        for (const connection of connections) {
            const repository = connection.getRepository(DefaultWithTransformer)

            const entity = new DefaultWithTransformer()
            entity.columnWithTransformerOnly = 200

            await repository.save(entity)

            const loadedEntity = await repository.findOneBy({
                id: entity.id,
            })

            // default: 101 in DB, after from(): 100
            expect(loadedEntity!.columnWithDefaultAndTransformer).to.equal(100)
            expect(loadedEntity!.columnWithTransformerOnly).to.equal(200)
        }
    })

    it("should preserve values correctly after update", async () => {
        for (const connection of connections) {
            const repository = connection.getRepository(DefaultWithTransformer)

            const entity = new DefaultWithTransformer()
            entity.columnWithDefaultAndTransformer = 300
            entity.columnWithTransformerOnly = 400
            await repository.save(entity)

            entity.columnWithDefaultAndTransformer = 500
            entity.columnWithTransformerOnly = 600
            await repository.save(entity)

            expect(entity.columnWithDefaultAndTransformer).to.equal(500)
            expect(entity.columnWithTransformerOnly).to.equal(600)
        }
    })

    it("should call transformer's from() method only once for columns with default value", async () => {
        for (const connection of connections) {
            const repository = connection.getRepository(DefaultWithTransformer)

            const entity = new DefaultWithTransformer()
            entity.columnWithDefaultAndTransformer = 300
            entity.columnWithTransformerOnly = 400

            CountingTransformer.reset()
            await repository.save(entity)

            // from() should be called only once (not twice due to double transformation bug)
            expect(CountingTransformer.fromCallCount).to.equal(1)
        }
    })
})
