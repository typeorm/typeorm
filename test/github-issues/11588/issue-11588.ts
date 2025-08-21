import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User } from "./entity/User"

describe("github issues > #11588 Fine Grained Control over Update fields on Upsert", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: [
                    "postgres",
                    "mysql",
                    "mariadb",
                    "sqlite",
                    "better-sqlite3",
                ],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should only update specified fields when updateOnly option is provided", () =>
        Promise.all(
            connections.map(async (connection) => {
                const userRepository = connection.getRepository(User)

                const initialUser = {
                    id: 1,
                    email: "user@example.com",
                    username: "initialuser",
                }
                await userRepository.save(initialUser)

                const updatedUser = {
                    ...initialUser,
                    email: "updated@example.com",
                    username: "updateduser",
                }

                await userRepository.upsert(updatedUser, {
                    conflictPaths: ["id"],
                    updateOnly: ["email"],
                })

                const result = await userRepository.findOne({
                    where: { id: 1 },
                })

                expect(result).to.exist
                expect(result!.email).to.equal(updatedUser.email)
                expect(result!.username).to.equal(initialUser.username)
            }),
        ))

    it("should work with object form of updateOnly option", () =>
        Promise.all(
            connections.map(async (connection) => {
                const userRepository = connection.getRepository(User)

                const initialUser = {
                    id: 2,
                    email: "user2@example.com",
                    username: "user2",
                }
                await userRepository.save(initialUser)

                const updatedUser = {
                    id: 2,
                    email: "updated2@example.com",
                    username: "updateduser2",
                }

                await userRepository.upsert(updatedUser, {
                    conflictPaths: ["id"],
                    updateOnly: {
                        email: true,
                    },
                })

                const result = await userRepository.findOne({
                    where: { id: 2 },
                })

                expect(result).to.exist
                expect(result!.email).to.equal(updatedUser.email) // updated
                expect(result!.username).to.equal(initialUser.username) // not updated
            }),
        ))

    it("should work original behavior without updateOnly option", () =>
        Promise.all(
            connections.map(async (connection) => {
                const userRepository = connection.getRepository(User)

                const initialUser = {
                    id: 3,
                    email: "user3@example.com",
                    username: "user3",
                }
                await userRepository.save(initialUser)

                const updatedUser = {
                    id: 3,
                    email: "updated3@example.com",
                    username: "updateduser3",
                }

                await userRepository.upsert(updatedUser, {
                    conflictPaths: ["id"],
                })

                const result = await userRepository.findOne({
                    where: { id: 3 },
                })

                expect(result).to.exist
                expect(result!.email).to.equal(updatedUser.email)
                expect(result!.username).to.equal(updatedUser.username)
            }),
        ))

    // it("should work with bulk upsert using updateOnly", () =>
    //     Promise.all(
    //         connections.map(async (connection) => {
    //             const userRepository = connection.getRepository(User)

    //             const initialUsers = [
    //                 {
    //                     id: 4,
    //                     email: "user4@example.com",
    //                     username: "user4",
    //                     token: "token-4",
    //                     isAdmin: false,
    //                     profile: "Profile 4",
    //                 },
    //                 {
    //                     id: 5,
    //                     email: "user5@example.com",
    //                     username: "user5",
    //                     token: "token-5",
    //                     isAdmin: true,
    //                     profile: "Profile 5",
    //                 },
    //             ]
    //             await userRepository.save(initialUsers)

    //             const updatedData = [
    //                 {
    //                     id: 4,
    //                     email: "updated4@example.com",
    //                     username: "updateduser4",
    //                     token: "should-not-update-4",
    //                     isAdmin: true,
    //                     profile: "Updated profile 4",
    //                 },
    //                 {
    //                     id: 5,
    //                     email: "updated5@example.com",
    //                     username: "updateduser5",
    //                     token: "should-not-update-5",
    //                     isAdmin: false,
    //                     profile: "Updated profile 5",
    //                 },
    //             ]

    //             await userRepository.upsert(updatedData, {
    //                 conflictPaths: ["id"],
    //                 updateOnly: ["email", "profile"],
    //             })

    //             const results = await userRepository.find({
    //                 where: [{ id: 4 }, { id: 5 }],
    //                 order: { id: "ASC" },
    //             })

    //             expect(results).to.have.length(2)

    //             expect(results[0].email).to.equal("updated4@example.com")
    //             expect(results[0].profile).to.equal("Updated profile 4")
    //             expect(results[0].username).to.equal("user4")
    //             expect(results[0].token).to.equal("token-4")
    //             expect(results[0].isAdmin).to.equal(false)

    //             expect(results[1].email).to.equal("updated5@example.com")
    //             expect(results[1].profile).to.equal("Updated profile 5")
    //             expect(results[1].username).to.equal("user5")
    //             expect(results[1].token).to.equal("token-5")
    //             expect(results[1].isAdmin).to.equal(true)
    //         }),
    //     ))

    // it("should work with string-based conflict paths", () =>
    //     Promise.all(
    //         connections.map(async (connection) => {
    //             const userRepository = connection.getRepository(User)

    //             const initialUser = {
    //                 email: "conflict@example.com",
    //                 username: "conflictuser",
    //                 token: "conflict-token",
    //                 isAdmin: false,
    //                 profile: "Conflict profile",
    //             }
    //             await userRepository.save(initialUser)

    //             const updatedData = {
    //                 email: "conflict@example.com",
    //                 username: "updated-conflict-user",
    //                 token: "new-conflict-token",
    //                 isAdmin: true,
    //                 profile: "Updated conflict profile",
    //             }

    //             await userRepository.upsert(updatedData, {
    //                 conflictPaths: ["email"],
    //                 updateOnly: ["username"],
    //             })

    //             const result = await userRepository.findOne({
    //                 where: { email: "conflict@example.com" },
    //             })

    //             expect(result).to.exist
    //             expect(result!.username).to.equal("updated-conflict-user")
    //             expect(result!.token).to.equal("conflict-token")
    //             expect(result!.isAdmin).to.equal(false)
    //             expect(result!.profile).to.equal("Conflict profile")
    //         }),
    //     ))
})
