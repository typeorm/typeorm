import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { Post } from "./entity/Post"
import { Author } from "./entity/Author"
import { Brackets } from "../../../../src/query-builder/Brackets"

describe("query builder > brackets", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["sqlite"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should put parentheses in the SQL", () => {
        for (const connection of connections) {
            const sql = connection
                .createQueryBuilder(User, "user")
                .where("user.isAdmin = :isAdmin", { isAdmin: true })
                .orWhere(
                    new Brackets((qb) => {
                        qb.where("user.firstName = :firstName1", {
                            firstName1: "Hello",
                        }).andWhere("user.lastName = :lastName1", {
                            lastName1: "Mars",
                        })
                    }),
                )
                .orWhere(
                    new Brackets((qb) => {
                        qb.where("user.firstName = :firstName2", {
                            firstName2: "Hello",
                        }).andWhere("user.lastName = :lastName2", {
                            lastName2: "Earth",
                        })
                    }),
                )
                .andWhere(
                    new Brackets((qb) => {
                        qb.where("user.firstName = :firstName3 AND foo = bar", {
                            firstName3: "Hello",
                        })
                    }),
                )
                .disableEscaping()
                .getSql()

            expect(sql).to.be.equal(
                "SELECT user.id AS user_id, user.firstName AS user_firstName, " +
                    "user.lastName AS user_lastName, user.isAdmin AS user_isAdmin " +
                    "FROM user user " +
                    "WHERE user.isAdmin = ? " +
                    "OR (user.firstName = ? AND user.lastName = ?) " +
                    "OR (user.firstName = ? AND user.lastName = ?) " +
                    "AND (user.firstName = ? AND foo = bar)",
            )
        }
    })

    it("should put brackets correctly into WHERE expression", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user1 = new User()
                user1.firstName = "Timber"
                user1.lastName = "Saw"
                user1.isAdmin = false
                await connection.manager.save(user1)

                const user2 = new User()
                user2.firstName = "Alex"
                user2.lastName = "Messer"
                user2.isAdmin = false
                await connection.manager.save(user2)

                const user3 = new User()
                user3.firstName = "Umed"
                user3.lastName = "Pleerock"
                user3.isAdmin = true
                await connection.manager.save(user3)

                const users = await connection
                    .createQueryBuilder(User, "user")
                    .where("user.isAdmin = :isAdmin", { isAdmin: true })
                    .orWhere(
                        new Brackets((qb) => {
                            qb.where("user.firstName = :firstName1", {
                                firstName1: "Timber",
                            }).andWhere("user.lastName = :lastName1", {
                                lastName1: "Saw",
                            })
                        }),
                    )
                    .orWhere(
                        new Brackets((qb) => {
                            qb.where("user.firstName = :firstName2", {
                                firstName2: "Alex",
                            }).andWhere("user.lastName = :lastName2", {
                                lastName2: "Messer",
                            })
                        }),
                    )
                    .getMany()

                expect(users.length).to.be.equal(3)
            }),
        ))

    it("should be able to use join attributes in brackets", () =>
        Promise.all(
            connections.map(async (connection) => {
                const author = new Author()
                author.name = "gioboa"
                await connection.manager.save(author)

                const post = new Post()
                post.title = "About TypeORM"
                post.author = author
                await connection.manager.save(post)

                const posts = await connection
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.author", "author")
                    .where(
                        new Brackets((qb) => {
                            qb.where("author.name = :name", {
                                name: "gioboa",
                            })
                        }),
                    )
                    .getMany()

                expect(posts.length).to.be.equal(1)
                expect(posts[0].author).to.be.not.undefined
                expect(posts[0].author.name).to.be.equal("gioboa")
            }),
        ))
})
