import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/index.js"
import { User } from "./entity/user"
import { expect } from "chai"

describe("github issues > #10596 QueryBuilder allowing multiple where calls is dangerous", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("has to throw an exception if .where is called two times in a select", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(User)
                    .save([
                        { name: "Al" },
                        { name: "John" },
                        { name: "johnny" },
                        { name: "Jack" },
                    ])
                expect(() => {
                    dataSource.manager
                        .createQueryBuilder(User, "user")
                        .where("user.id > :id", { id: 1 })
                        .where("user.name = :name", { name: "Jack" })
                }).to.throw(".where method cannot be called two times or more.")
            }),
        ))

    it("has to throw an exception if .where is called two times in a update", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(User)
                    .save([
                        { name: "Al" },
                        { name: "John" },
                        { name: "johnny" },
                        { name: "Jack" },
                    ])
                expect(() => {
                    dataSource.manager
                        .createQueryBuilder(User, "user")
                        .update()
                        .where("user.id > :id", { id: 1 })
                        .where("user.name = :name", { name: "Jack" })
                }).to.throw(
                    ".where method cannot be called two times or more, or after .whereEntity method.",
                )
            }),
        ))

    it("has to throw an exception if .where is called two times in a delete", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(User)
                    .save([
                        { name: "Al" },
                        { name: "John" },
                        { name: "johnny" },
                        { name: "Jack" },
                    ])
                expect(() => {
                    dataSource.manager
                        .createQueryBuilder(User, "user")
                        .delete()
                        .where("user.id > :id", { id: 1 })
                        .where("user.name = :name", { name: "Jack" })
                }).to.throw(".where method cannot be called two times or more.")
            }),
        ))

    it("has to throw an exception if .where is called two times in a softDelete", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(User)
                    .save([
                        { name: "Al" },
                        { name: "John" },
                        { name: "johnny" },
                        { name: "Jack" },
                    ])
                expect(() => {
                    dataSource.manager
                        .createQueryBuilder(User, "user")
                        .softDelete()
                        .where("user.id > :id", { id: 1 })
                        .where("user.name = :name", { name: "Jack" })
                }).to.throw(
                    ".where method cannot be called two times or more, or after .whereEntity method.",
                )
            }),
        ))

    it("has to throw an exception if .where is called after .whereEntity in a softDelete", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(User)
                    .save([
                        { name: "Al" },
                        { name: "John" },
                        { name: "johnny" },
                        { name: "Jack" },
                    ])

                const userToDelete = new User()
                userToDelete.id = 4
                userToDelete.name = "Jack"
                expect(() => {
                    dataSource.manager
                        .createQueryBuilder(User, "user")
                        .softDelete()
                        .whereEntity(userToDelete)
                        .where("user.id > :id", { id: 1 })
                }).to.throw(
                    ".where method cannot be called two times or more, or after .whereEntity method.",
                )
            }),
        ))

    it("has to throw an exception if .whereEntity is called after .where in a softDelete", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(User)
                    .save([
                        { name: "Al" },
                        { name: "John" },
                        { name: "johnny" },
                        { name: "Jack" },
                    ])

                const userToDelete = new User()
                userToDelete.id = 4
                userToDelete.name = "Jack"
                expect(() => {
                    dataSource.manager
                        .createQueryBuilder(User, "user")
                        .softDelete()
                        .where("user.id > :id", { id: 1 })
                        .whereEntity(userToDelete)
                }).to.throw(
                    ".whereEntity method cannot be called two times or more, or after .where method.",
                )
            }),
        ))

    it("has to throw an exception if .where is called after .whereEntity in a update", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(User)
                    .save([
                        { name: "Al" },
                        { name: "John" },
                        { name: "johnny" },
                        { name: "Jack" },
                    ])

                const userToUpdate = new User()
                userToUpdate.id = 4
                userToUpdate.name = "Jack"
                expect(() => {
                    dataSource.manager
                        .createQueryBuilder(User, "user")
                        .update()
                        .whereEntity(userToUpdate)
                        .where("user.id > :id", { id: 1 })
                }).to.throw(
                    ".where method cannot be called two times or more, or after .whereEntity method.",
                )
            }),
        ))

    it("has to throw an exception if .whereEntity is called after .where in a update", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(User)
                    .save([
                        { name: "Al" },
                        { name: "John" },
                        { name: "johnny" },
                        { name: "Jack" },
                    ])

                const userToUpdate = new User()
                userToUpdate.id = 4
                userToUpdate.name = "Jack"
                expect(() => {
                    dataSource.manager
                        .createQueryBuilder(User, "user")
                        .update()
                        .where("user.id > :id", { id: 1 })
                        .whereEntity(userToUpdate)
                }).to.throw(
                    ".whereEntity method cannot be called two times or more, or after .where method.",
                )
            }),
        ))

    it("hasn't to throw an exception if .whereEntity is called once in a update", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(User)
                    .save([
                        { name: "Al" },
                        { name: "John" },
                        { name: "johnny" },
                        { name: "Jack" },
                    ])

                const userToUpdate = new User()
                userToUpdate.id = 4
                userToUpdate.name = "Jack"
                expect(() => {
                    dataSource.manager
                        .createQueryBuilder(User, "user")
                        .update()
                        .whereEntity(userToUpdate)
                }).not.to.throw(
                    ".whereEntity method cannot be called two times or more, or after .where method.",
                )
            }),
        ))

    it("hasn't to throw an exception if .whereEntity is called once in a softDelete", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(User)
                    .save([
                        { name: "Al" },
                        { name: "John" },
                        { name: "johnny" },
                        { name: "Jack" },
                    ])

                const userToDelete = new User()
                userToDelete.id = 4
                userToDelete.name = "Jack"
                expect(() => {
                    dataSource.manager
                        .createQueryBuilder(User, "user")
                        .softDelete()
                        .whereEntity(userToDelete)
                }).not.to.throw(
                    ".whereEntity method cannot be called two times or more, or after .where method.",
                )
            }),
        ))

    it("hasn't to throw an exception if .where is called once in a select", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(User)
                    .save([
                        { name: "Al" },
                        { name: "John" },
                        { name: "johnny" },
                        { name: "Jack" },
                    ])

                const users = await dataSource.manager
                    .createQueryBuilder(User, "user")
                    .where("user.id > :id", { id: 1 })
                    .getMany()
                expect(users).to.have.length(3)
            }),
        ))

    it("hasn't to throw an exception if .where is called once in an update", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(User)
                    .save([
                        { name: "Al" },
                        { name: "John" },
                        { name: "johnny" },
                        { name: "Jack" },
                    ])

                expect(async () => {
                    await dataSource.manager
                        .createQueryBuilder(User, "user")
                        .update()
                        .where("user.id = :id", { id: 1 })
                        .set({ name: "update" })
                        .execute()
                }).not.to.throw(
                    ".where method cannot be called two times or more.",
                )
            }),
        ))

    it("hasn't to throw an exception if .where is called once in a delete", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(User)
                    .save([
                        { name: "Al" },
                        { name: "John" },
                        { name: "johnny" },
                        { name: "Jack" },
                    ])

                expect(async () => {
                    await dataSource.manager
                        .createQueryBuilder(User, "user")
                        .delete()
                        .where("user.id = :id", { id: 1 })
                        .execute()
                }).not.to.throw(
                    ".where method cannot be called two times or more.",
                )
            }),
        ))

    it("hasn't to throw an exception if .where is called once in a softDelete", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(User)
                    .save([
                        { name: "Al" },
                        { name: "John" },
                        { name: "johnny" },
                        { name: "Jack" },
                    ])

                expect(async () => {
                    await dataSource.manager
                        .createQueryBuilder(User, "user")
                        .softDelete()
                        .where("user.id = :id", { id: 1 })
                        .execute()
                }).not.to.throw(
                    ".where method cannot be called two times or more.",
                )
            }),
        ))
})
