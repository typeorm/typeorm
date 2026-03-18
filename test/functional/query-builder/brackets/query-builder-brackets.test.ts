import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { Post } from "./entity/Post"
import { Author } from "./entity/Author"
import { Brackets } from "../../../../src/query-builder/Brackets"

describe("query builder > brackets", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["better-sqlite3", "postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should put parentheses in the SQL", () => {
        for (const dataSource of dataSources) {
            const sql = dataSource
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

            if (dataSource.driver.options.type === "postgres") {
                expect(sql).to.be.equal(
                    "SELECT user.id AS user_id, user.firstName AS user_firstName, " +
                        "user.lastName AS user_lastName, user.isAdmin AS user_isAdmin " +
                        "FROM user user " +
                        "WHERE user.isAdmin = $1 " +
                        "OR (user.firstName = $2 AND user.lastName = $3) " +
                        "OR (user.firstName = $4 AND user.lastName = $5) " +
                        "AND (user.firstName = $6 AND foo = bar)",
                )
            } else {
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
        }
    })

    it("should put brackets correctly into WHERE expression", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user1 = new User()
                user1.firstName = "Timber"
                user1.lastName = "Saw"
                user1.isAdmin = false
                await dataSource.manager.save(user1)

                const user2 = new User()
                user2.firstName = "Alex"
                user2.lastName = "Messer"
                user2.isAdmin = false
                await dataSource.manager.save(user2)

                const user3 = new User()
                user3.firstName = "Umed"
                user3.lastName = "Pleerock"
                user3.isAdmin = true
                await dataSource.manager.save(user3)

                const users = await dataSource
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
            dataSources.map(async (dataSource) => {
                const author = new Author()
                author.name = "gioboa"
                await dataSource.manager.save(author)

                const post = new Post()
                post.title = "About TypeORM"
                post.author = author
                await dataSource.manager.save(post)

                const posts = await dataSource
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.author", "author")
                    .andWhere(
                        new Brackets((qb) => {
                            qb.where({
                                author: {
                                    name: "gioboa",
                                },
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
