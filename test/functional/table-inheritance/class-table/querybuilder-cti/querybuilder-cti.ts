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
import { AuthPolicy } from "./entity/AuthPolicy"
import { Profile } from "./entity/Profile"
import { Credential } from "./entity/Credential"
import { expect } from "chai"

describe("table-inheritance > class-table > querybuilder-cti", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    const ACCOUNT_UUID = "a0000000-0000-0000-0000-000000000001"

    async function insertUser(
        connection: DataSource,
        nameID: string,
        email: string,
    ): Promise<User> {
        const auth = new AuthPolicy()
        auth.rules = "user-rules"
        const profile = new Profile()
        profile.displayName = nameID

        const cred = new Credential()
        cred.type = "admin"
        cred.resourceID = "res-1"

        const user = new User()
        user.nameID = nameID
        user.email = email
        user.accountID = ACCOUNT_UUID
        user.authorization = auth
        user.profile = profile
        user.credentials = [cred]
        return connection.getRepository(User).save(user)
    }

    async function insertOrg(
        connection: DataSource,
        nameID: string,
        industry: string,
    ): Promise<Organization> {
        const auth = new AuthPolicy()
        auth.rules = "org-rules"
        const profile = new Profile()
        profile.displayName = nameID

        const org = new Organization()
        org.nameID = nameID
        org.industry = industry
        org.accountID = ACCOUNT_UUID
        org.authorization = auth
        org.profile = profile
        org.credentials = []
        return connection.getRepository(Organization).save(org)
    }

    it("(6a) should QB on child with leftJoinAndSelect of inherited eager relation", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@example.com",
                )

                const user = await connection
                    .getRepository(User)
                    .createQueryBuilder("user")
                    .leftJoinAndSelect("user.authorization", "auth")
                    .where("user.id = :id", { id: saved.id })
                    .getOne()

                expect(user).to.not.be.null
                expect(user!.authorization).to.not.be.undefined
                expect(user!.authorization.rules).to.equal("user-rules")
            }),
        ))

    it("(6b) should QB on child with leftJoin of inherited credentials", () =>
        Promise.all(
            connections.map(async (connection) => {
                await insertUser(connection, "alice", "alice@example.com")
                await insertUser(connection, "bob", "bob@example.com")

                const users = await connection
                    .getRepository(User)
                    .createQueryBuilder("user")
                    .leftJoin("user.credentials", "cred")
                    .addSelect(["cred.type", "cred.resourceID"])
                    .where("cred.type = :type", { type: "admin" })
                    .getMany()

                expect(users.length).to.be.greaterThanOrEqual(1)
                for (const u of users) {
                    expect(u.credentials).to.be.an("array")
                    expect(u.credentials[0].type).to.equal("admin")
                }
            }),
        ))

    it("(6c) should QB on root entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@example.com",
                )

                const actor = await connection
                    .getRepository(Actor)
                    .createQueryBuilder("actor")
                    .where("actor.id = :id", { id: saved.id })
                    .getOne()

                expect(actor).to.not.be.null
                expect(actor!.id).to.equal(saved.id)
                expect(actor).to.be.instanceOf(User)
                expect((actor as User).email).to.equal("alice@example.com")
            }),
        ))

    it("(6d) should QB with NOT IN on child", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user1 = await insertUser(
                    connection,
                    "alice",
                    "alice@example.com",
                )
                const user2 = await insertUser(
                    connection,
                    "bob",
                    "bob@example.com",
                )

                const users = await connection
                    .getRepository(User)
                    .createQueryBuilder("user")
                    .where("user.id NOT IN (:...excludeIds)", {
                        excludeIds: [user2.id],
                    })
                    .getMany()

                expect(users).to.have.length(1)
                expect(users[0].id).to.equal(user1.id)
            }),
        ))

    it("(6e) should QB getCount on root entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                await insertUser(connection, "alice", "alice@example.com")
                await insertOrg(connection, "acme", "Tech")

                const count = await connection
                    .getRepository(Actor)
                    .createQueryBuilder("actor")
                    .getCount()

                expect(count).to.equal(2)
            }),
        ))

    it("(6f) should QB on child with orderBy on parent column", () =>
        Promise.all(
            connections.map(async (connection) => {
                await insertUser(connection, "bob", "bob@example.com")
                await insertUser(connection, "alice", "alice@example.com")

                const users = await connection
                    .getRepository(User)
                    .createQueryBuilder("user")
                    .orderBy("user.nameID", "ASC")
                    .getMany()

                expect(users).to.have.length(2)
                expect(users[0].nameID).to.equal("alice")
                expect(users[1].nameID).to.equal("bob")
            }),
        ))
})
