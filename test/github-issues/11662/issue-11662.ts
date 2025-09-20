import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { User } from "./entity/User"
import { Post } from "./entity/Post"

describe("github issues > #11662 leftJoin with skip/take not working properly with pagination", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [User, Post],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["better-sqlite3"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should work correctly when using leftJoin with skip/take", () =>
        Promise.all(
            connections.map(async (connection) => {
                const userRepo = connection.getRepository(User)
                const postRepo = connection.getRepository(Post)

                // Create users
                const users = await userRepo.save([
                    { name: "Alice" },
                    { name: "Bob" },
                ])

                // Create multiple posts for each user
                await postRepo.save([
                    { title: "Alice's Post 1", user: users[0] },
                    { title: "Alice's Post 2", user: users[0] },
                    { title: "Bob's Post 1", user: users[1] },
                    { title: "Bob's Post 2", user: users[1] },
                ])

                const result = await postRepo
                    .createQueryBuilder("post")
                    .leftJoin("post.user", "user")
                    .select(["post.id", "post.title", "user.id", "user.name"])
                    .skip(1)
                    .take(2)
                    .getMany()

                expect(result).to.have.lengthOf(2)
                result.forEach((post) => {
                    expect(post.user).to.not.be.undefined
                    expect(post.user.id).to.be.a("number")
                    expect(post.user.name).to.be.a("string")
                })
            }),
        ))

    it("should work correctly with leftJoinAndSelect", () =>
        Promise.all(
            connections.map(async (connection) => {
                const userRepo = connection.getRepository(User)
                const postRepo = connection.getRepository(Post)

                // Create users
                const users = await userRepo.save([
                    { name: "Alice" },
                    { name: "Bob" },
                ])

                // Create multiple posts for each user
                await postRepo.save([
                    { title: "Alice's Post 1", user: users[0] },
                    { title: "Alice's Post 2", user: users[0] },
                    { title: "Bob's Post 1", user: users[1] },
                    { title: "Bob's Post 2", user: users[1] },
                ])

                const result = await postRepo
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.user", "user")
                    .skip(1)
                    .take(2)
                    .getMany()

                expect(result).to.have.lengthOf(2)
                result.forEach((post) => {
                    expect(post.user).to.not.be.undefined
                    expect(post.user.id).to.be.a("number")
                    expect(post.user.name).to.be.a("string")
                })
            }),
        ))

    it("should work correctly with explicit primary key selection", () =>
        Promise.all(
            connections.map(async (connection) => {
                const userRepo = connection.getRepository(User)
                const postRepo = connection.getRepository(Post)

                // Create users
                const users = await userRepo.save([
                    { name: "Alice" },
                    { name: "Bob" },
                ])

                // Create multiple posts for each user
                await postRepo.save([
                    { title: "Alice's Post 1", user: users[0] },
                    { title: "Alice's Post 2", user: users[0] },
                    { title: "Bob's Post 1", user: users[1] },
                    { title: "Bob's Post 2", user: users[1] },
                ])

                const result = await postRepo
                    .createQueryBuilder("post")
                    .leftJoin("post.user", "user")
                    .select(["post.id", "post.title", "user.id", "user.name"])
                    .skip(1)
                    .take(2)
                    .getMany()

                expect(result).to.have.lengthOf(2)
                result.forEach((post) => {
                    expect(post.user).to.not.be.undefined
                    expect(post.user.id).to.be.a("number")
                    expect(post.user.name).to.be.a("string")
                })
            }),
        ))
})
