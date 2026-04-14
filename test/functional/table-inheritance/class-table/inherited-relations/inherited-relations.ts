import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Actor } from "./entity/Actor"
import { User } from "./entity/User"
import { Organization } from "./entity/Organization"
import { Tag } from "./entity/Tag"
import { expect } from "chai"

describe("table-inheritance > class-table > inherited-relations", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // ---------------------------------------------------------------
    // Item 1: find({ relations }) on inherited parent relation
    // ---------------------------------------------------------------

    it("should load inherited parent OneToOne relation via User find({ relations })", () =>
        Promise.all(
            connections.map(async (connection) => {
                const tag = new Tag()
                tag.label = "admin"
                await connection.getRepository(Tag).save(tag)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.tag = tag
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .find({ relations: { tag: true } })

                expect(loaded).to.have.length(1)
                expect(loaded[0].name).to.equal("Alice")
                expect(loaded[0].email).to.equal("alice@example.com")
                expect(loaded[0].tag).to.not.be.undefined
                expect(loaded[0].tag).to.not.be.null
                expect(loaded[0].tag.label).to.equal("admin")
            }),
        ))

    it("should load inherited parent OneToOne relation via Organization find({ relations })", () =>
        Promise.all(
            connections.map(async (connection) => {
                const tag = new Tag()
                tag.label = "enterprise"
                await connection.getRepository(Tag).save(tag)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.tag = tag
                await connection.getRepository(Organization).save(org)

                const loaded = await connection
                    .getRepository(Organization)
                    .find({ relations: { tag: true } })

                expect(loaded).to.have.length(1)
                expect(loaded[0].name).to.equal("Acme")
                expect(loaded[0].industry).to.equal("Tech")
                expect(loaded[0].tag).to.not.be.undefined
                expect(loaded[0].tag).to.not.be.null
                expect(loaded[0].tag.label).to.equal("enterprise")
            }),
        ))

    it("should load inherited parent relation via findOne with relations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const tag = new Tag()
                tag.label = "vip"
                await connection.getRepository(Tag).save(tag)

                const user = new User()
                user.name = "Bob"
                user.email = "bob@example.com"
                user.tag = tag
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOne({
                        where: { id: user.id },
                        relations: { tag: true },
                    })

                expect(loaded).to.not.be.null
                expect(loaded!.tag).to.not.be.undefined
                expect(loaded!.tag).to.not.be.null
                expect(loaded!.tag.label).to.equal("vip")
            }),
        ))

    it("should return null tag when no tag is assigned via find({ relations })", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "NoTag"
                user.email = "notag@example.com"
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .find({ relations: { tag: true } })

                expect(loaded).to.have.length(1)
                expect(loaded[0].tag).to.be.null
            }),
        ))

    // ---------------------------------------------------------------
    // Item 2: QueryBuilder leftJoinAndSelect on inherited parent relation
    // ---------------------------------------------------------------

    it("should load inherited parent relation via QueryBuilder leftJoinAndSelect on User", () =>
        Promise.all(
            connections.map(async (connection) => {
                const tag = new Tag()
                tag.label = "builder-tag"
                await connection.getRepository(Tag).save(tag)

                const user = new User()
                user.name = "Charlie"
                user.email = "charlie@example.com"
                user.tag = tag
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .leftJoinAndSelect("u.tag", "t")
                    .getOne()

                expect(loaded).to.not.be.null
                expect(loaded!.name).to.equal("Charlie")
                expect(loaded!.email).to.equal("charlie@example.com")
                expect(loaded!.tag).to.not.be.undefined
                expect(loaded!.tag).to.not.be.null
                expect(loaded!.tag.label).to.equal("builder-tag")
            }),
        ))

    it("should load inherited parent relation via QueryBuilder leftJoinAndSelect on Organization", () =>
        Promise.all(
            connections.map(async (connection) => {
                const tag = new Tag()
                tag.label = "org-tag"
                await connection.getRepository(Tag).save(tag)

                const org = new Organization()
                org.name = "OrgCorp"
                org.industry = "Finance"
                org.tag = tag
                await connection.getRepository(Organization).save(org)

                const loaded = await connection
                    .getRepository(Organization)
                    .createQueryBuilder("o")
                    .leftJoinAndSelect("o.tag", "t")
                    .getOne()

                expect(loaded).to.not.be.null
                expect(loaded!.name).to.equal("OrgCorp")
                expect(loaded!.industry).to.equal("Finance")
                expect(loaded!.tag).to.not.be.undefined
                expect(loaded!.tag).to.not.be.null
                expect(loaded!.tag.label).to.equal("org-tag")
            }),
        ))

    it("should load inherited parent relation via QueryBuilder with where clause", () =>
        Promise.all(
            connections.map(async (connection) => {
                const tag1 = new Tag()
                tag1.label = "first"
                await connection.getRepository(Tag).save(tag1)

                const tag2 = new Tag()
                tag2.label = "second"
                await connection.getRepository(Tag).save(tag2)

                const user1 = new User()
                user1.name = "First"
                user1.email = "first@example.com"
                user1.tag = tag1
                await connection.getRepository(User).save(user1)

                const user2 = new User()
                user2.name = "Second"
                user2.email = "second@example.com"
                user2.tag = tag2
                await connection.getRepository(User).save(user2)

                const loaded = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .leftJoinAndSelect("u.tag", "t")
                    .where("t.label = :label", { label: "second" })
                    .getOne()

                expect(loaded).to.not.be.null
                expect(loaded!.name).to.equal("Second")
                expect(loaded!.tag.label).to.equal("second")
            }),
        ))

    it("should load inherited parent relation alongside child-specific data via QueryBuilder", () =>
        Promise.all(
            connections.map(async (connection) => {
                const tag = new Tag()
                tag.label = "mixed"
                await connection.getRepository(Tag).save(tag)

                const user = new User()
                user.name = "Mixed"
                user.email = "mixed@example.com"
                user.tag = tag
                await connection.getRepository(User).save(user)

                // Select specific fields
                const loaded = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .leftJoinAndSelect("u.tag", "t")
                    .select(["u.id", "u.name", "u.email", "t.id", "t.label"])
                    .getOne()

                expect(loaded).to.not.be.null
                expect(loaded!.name).to.equal("Mixed")
                expect(loaded!.email).to.equal("mixed@example.com")
                expect(loaded!.tag).to.not.be.null
                expect(loaded!.tag.label).to.equal("mixed")
            }),
        ))

    // ---------------------------------------------------------------
    // Parent polymorphic query with inherited relation
    // ---------------------------------------------------------------

    it("should load inherited parent relation for all child types via Actor find({ relations })", () =>
        Promise.all(
            connections.map(async (connection) => {
                const tag1 = new Tag()
                tag1.label = "user-tag"
                await connection.getRepository(Tag).save(tag1)

                const tag2 = new Tag()
                tag2.label = "org-tag"
                await connection.getRepository(Tag).save(tag2)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.tag = tag1
                await connection.getRepository(User).save(user)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.tag = tag2
                await connection.getRepository(Organization).save(org)

                const actors = await connection
                    .getRepository(Actor)
                    .find({
                        relations: { tag: true },
                        order: { id: "ASC" },
                    })

                expect(actors).to.have.length(2)

                const loadedUser = actors[0] as User
                expect(loadedUser).to.be.instanceOf(User)
                expect(loadedUser.tag).to.not.be.null
                expect(loadedUser.tag.label).to.equal("user-tag")

                const loadedOrg = actors[1] as Organization
                expect(loadedOrg).to.be.instanceOf(Organization)
                expect(loadedOrg.tag).to.not.be.null
                expect(loadedOrg.tag.label).to.equal("org-tag")
            }),
        ))

    it("should load inherited parent relation via Actor QueryBuilder leftJoinAndSelect", () =>
        Promise.all(
            connections.map(async (connection) => {
                const tag = new Tag()
                tag.label = "poly-tag"
                await connection.getRepository(Tag).save(tag)

                const user = new User()
                user.name = "Poly"
                user.email = "poly@example.com"
                user.tag = tag
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(Actor)
                    .createQueryBuilder("a")
                    .leftJoinAndSelect("a.tag", "t")
                    .where("a.id = :id", { id: user.id })
                    .getOne()

                expect(loaded).to.not.be.null
                expect(loaded).to.be.instanceOf(User)
                expect(loaded!.tag).to.not.be.null
                expect(loaded!.tag.label).to.equal("poly-tag")
            }),
        ))
})
