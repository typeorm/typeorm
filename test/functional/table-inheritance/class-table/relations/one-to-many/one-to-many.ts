import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { DataSource } from "../../../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { Organization } from "./entity/Organization"
import { Post } from "./entity/Post"
import { Department } from "./entity/Department"
import { expect } from "chai"

describe("table-inheritance > class-table > relations > one-to-many", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly save child entities with OneToMany relations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const post1 = new Post()
                post1.title = "Hello World"
                post1.author = user
                await connection.getRepository(Post).save(post1)

                const post2 = new Post()
                post2.title = "Second Post"
                post2.author = user
                await connection.getRepository(Post).save(post2)

                const posts = await connection.getRepository(Post).find()
                expect(posts).to.have.length(2)
            }),
        ))

    it("should load OneToMany relations via repository find with relations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const post1 = new Post()
                post1.title = "Hello"
                post1.author = user
                await connection.getRepository(Post).save(post1)

                const post2 = new Post()
                post2.title = "World"
                post2.author = user
                await connection.getRepository(Post).save(post2)

                const loadedUsers = await connection
                    .getRepository(User)
                    .find({ relations: { posts: true } })

                expect(loadedUsers).to.have.length(1)
                expect(loadedUsers[0].posts).to.have.length(2)
                expect(loadedUsers[0].name).to.equal("Alice")
                expect(loadedUsers[0].email).to.equal("alice@example.com")
            }),
        ))

    it("should load OneToMany relations via QueryBuilder leftJoinAndSelect", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const post = new Post()
                post.title = "Hello"
                post.author = user
                await connection.getRepository(Post).save(post)

                const loaded = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .leftJoinAndSelect("u.posts", "p")
                    .getOne()

                expect(loaded).to.not.be.null
                expect(loaded!.posts).to.have.length(1)
                expect(loaded!.posts[0].title).to.equal("Hello")
                expect(loaded!.name).to.equal("Alice")
            }),
        ))

    it("should load different child relations independently", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const post = new Post()
                post.title = "Hello"
                post.author = user
                await connection.getRepository(Post).save(post)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                const dept = new Department()
                dept.name = "Engineering"
                dept.organization = org
                await connection.getRepository(Department).save(dept)

                // Load user with posts
                const loadedUser = await connection
                    .getRepository(User)
                    .find({ relations: { posts: true } })
                expect(loadedUser[0].posts).to.have.length(1)

                // Load org with departments
                const loadedOrg = await connection
                    .getRepository(Organization)
                    .find({ relations: { departments: true } })
                expect(loadedOrg[0].departments).to.have.length(1)
                expect(loadedOrg[0].departments[0].name).to.equal(
                    "Engineering",
                )
            }),
        ))

    it("should handle child with empty relation array", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .find({ relations: { posts: true } })

                expect(loaded).to.have.length(1)
                expect(loaded[0].posts).to.have.length(0)
            }),
        ))

    it("should load ManyToOne side back to CTI child entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const post = new Post()
                post.title = "Hello"
                post.author = user
                await connection.getRepository(Post).save(post)

                const loadedPost = await connection
                    .getRepository(Post)
                    .find({ relations: { author: true } })

                expect(loadedPost).to.have.length(1)
                expect(loadedPost[0].author).to.not.be.undefined
                expect(loadedPost[0].author.name).to.equal("Alice")
                expect(loadedPost[0].author.email).to.equal(
                    "alice@example.com",
                )
            }),
        ))
})
