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
                    email: "user1@example.com",
                    username: "initialuser",
                }
                const savedUser = await userRepository.save(initialUser)

                const updatedUser = {
                    ...savedUser,
                    email: "updated1@example.com",
                    username: "updateduser",
                }

                await userRepository.upsert(updatedUser, {
                    conflictPaths: ["id"],
                    updateOnly: ["email"],
                })

                const result = await userRepository.findOne({
                    where: { id: savedUser.id },
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
                    email: "user2@example.com",
                    username: "user2",
                }
                const savedUser = await userRepository.save(initialUser)

                const updatedUser = {
                    ...savedUser,
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
                    where: { id: savedUser.id },
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
                    email: "user3@example.com",
                    username: "user3",
                }
                const savedUser = await userRepository.save(initialUser)

                const updatedUser = {
                    ...savedUser,
                    email: "updated3@example.com",
                    username: "updateduser3",
                }

                await userRepository.upsert(updatedUser, {
                    conflictPaths: ["id"],
                })

                const result = await userRepository.findOne({
                    where: { id: savedUser.id },
                })

                expect(result).to.exist
                expect(result!.email).to.equal(updatedUser.email)
                expect(result!.username).to.equal(updatedUser.username)
            }),
        ))
})
