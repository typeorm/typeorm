import "reflect-metadata"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { User } from "./entity/User"

describe("persistence > basic functionality", function () {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should save an entity", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.save(new Post(1, "Hello Post"))
            }),
        ))

    it("should remove an entity", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post(1, "Hello Post")
                await dataSource.manager.save(post)
                await dataSource.manager.remove(post)
            }),
        ))

    it("should throw an error when not an object is passed to a save method", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager
                    .save(undefined)
                    .should.be.rejectedWith(
                        `Cannot save, given value must be an entity, instead "undefined" is given.`,
                    )
                await dataSource.manager
                    .save(null)
                    .should.be.rejectedWith(
                        `Cannot save, given value must be an entity, instead "null" is given.`,
                    )
                await dataSource.manager
                    .save(123)
                    .should.be.rejectedWith(
                        `Cannot save, given value must be an entity, instead "123" is given.`,
                    )
            }),
        ))

    it("should throw an error when not an object is passed to a remove method", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager
                    .remove(undefined)
                    .should.be.rejectedWith(
                        `Cannot remove, given value must be an entity, instead "undefined" is given.`,
                    )
                await dataSource.manager
                    .remove(null)
                    .should.be.rejectedWith(
                        `Cannot remove, given value must be an entity, instead "null" is given.`,
                    )
                await dataSource.manager
                    .remove(123)
                    .should.be.rejectedWith(
                        `Cannot remove, given value must be an entity, instead "123" is given.`,
                    )
            }),
        ))

    it("should throw an exception if object literal is given instead of constructed entity because it cannot determine what to save", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager
                    .save({})
                    .should.be.rejectedWith(
                        `Cannot save, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`,
                    )
                await dataSource.manager
                    .save([{}, {}])
                    .should.be.rejectedWith(
                        `Cannot save, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`,
                    )
                await dataSource.manager
                    .save([new Post(1, "Hello Post"), {}])
                    .should.be.rejectedWith(
                        `Cannot save, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`,
                    )
                await dataSource.manager
                    .remove({})
                    .should.be.rejectedWith(
                        `Cannot remove, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`,
                    )
                await dataSource.manager
                    .remove([{}, {}])
                    .should.be.rejectedWith(
                        `Cannot remove, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`,
                    )
                await dataSource.manager
                    .remove([new Post(1, "Hello Post"), {}])
                    .should.be.rejectedWith(
                        `Cannot remove, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`,
                    )
            }),
        ))

    it("should be able to save and remove entities of different types", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post(1, "Hello Post")
                const category = new Category(1, "Hello Category")
                const user = new User(1, "Hello User")

                await dataSource.manager.save([post, category, user])
                await dataSource.manager
                    .findOneBy(Post, { id: 1 })
                    .should.eventually.eql({ id: 1, title: "Hello Post" })
                await dataSource.manager
                    .findOneBy(Category, { id: 1 })
                    .should.eventually.eql({ id: 1, name: "Hello Category" })
                await dataSource.manager
                    .findOneBy(User, { id: 1 })
                    .should.eventually.eql({ id: 1, name: "Hello User" })

                await dataSource.manager.remove([post, category, user])
                await dataSource.manager.findOneBy(Post, { id: 1 }).should
                    .eventually.be.null
                await dataSource.manager.findOneBy(Category, { id: 1 }).should
                    .eventually.be.null
                await dataSource.manager.findOneBy(User, { id: 1 }).should
                    .eventually.be.null
            }),
        ))
})
