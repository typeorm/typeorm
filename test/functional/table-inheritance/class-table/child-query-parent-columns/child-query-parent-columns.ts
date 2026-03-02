import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { Organization } from "./entity/Organization"
import { AuthPolicy } from "./entity/AuthPolicy"
import { Profile } from "./entity/Profile"
import { Credential } from "./entity/Credential"
import { expect } from "chai"
import { In } from "../../../../../src"

describe("table-inheritance > class-table > child-query-parent-columns", () => {
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
        profile.displayName = nameID.charAt(0).toUpperCase() + nameID.slice(1)

        const cred = new Credential()
        cred.type = "UserSelfManagement"
        cred.resourceID = ""

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
        profile.displayName = nameID.charAt(0).toUpperCase() + nameID.slice(1)

        const org = new Organization()
        org.nameID = nameID
        org.industry = industry
        org.accountID = ACCOUNT_UUID
        org.authorization = auth
        org.profile = profile
        org.credentials = []
        return connection.getRepository(Organization).save(org)
    }

    it("(2a) should findOne child by parent-table column (nameID)", () =>
        Promise.all(
            connections.map(async (connection) => {
                await insertUser(connection, "alice", "alice@example.com")

                const user = await connection.manager.findOne(User, {
                    where: { nameID: "alice" },
                })
                expect(user).to.not.be.null
                expect(user!.email).to.equal("alice@example.com")
                expect(user!.nameID).to.equal("alice")
            }),
        ))

    it("(2b) should findOne child by child-table column (email)", () =>
        Promise.all(
            connections.map(async (connection) => {
                await insertUser(connection, "alice", "alice@example.com")

                const user = await connection.manager.findOne(User, {
                    where: { email: "alice@example.com" },
                })
                expect(user).to.not.be.null
                expect(user!.nameID).to.equal("alice")
            }),
        ))

    it("(2c) should findOne child by BOTH parent and child columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                await insertUser(connection, "alice", "alice@example.com")

                const user = await connection.manager.findOne(User, {
                    where: {
                        nameID: "alice",
                        email: "alice@example.com",
                    },
                })
                expect(user).to.not.be.null
                expect(user!.id).to.be.a("string")
            }),
        ))

    it("(2d) should find with select on child-specific columns only", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertOrg(
                    connection,
                    "acme",
                    "Tech",
                )

                const org = await connection.manager.findOne(Organization, {
                    where: { id: saved.id },
                    select: { id: true, accountID: true },
                })
                expect(org).to.not.be.null
                expect(org!.accountID).to.equal(ACCOUNT_UUID)
            }),
        ))

    it("(2e) should find child with inherited credentials relation", () =>
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

                const users = await connection.manager.find(User, {
                    where: { id: In([user1.id, user2.id]) },
                    relations: { credentials: true },
                })
                expect(users).to.have.length(2)
                for (const u of users) {
                    expect(u.credentials).to.be.an("array")
                    expect(u.credentials).to.have.length(1)
                }
            }),
        ))

    it("(2f) should find child with inherited profile relation", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = await insertUser(
                    connection,
                    "alice",
                    "alice@example.com",
                )

                const users = await connection.manager.find(User, {
                    where: { id: In([user.id]) },
                    relations: { profile: true },
                })
                expect(users).to.have.length(1)
                expect(users[0].profile).to.not.be.undefined
                expect(users[0].profile.displayName).to.equal("Alice")
            }),
        ))

    it("(2g) should find child with nested credentials where (OR logic via array)", () =>
        Promise.all(
            connections.map(async (connection) => {
                await insertUser(
                    connection,
                    "alice",
                    "alice@example.com",
                )

                const users = await connection.manager.find(User, {
                    where: [
                        {
                            credentials: {
                                type: "UserSelfManagement",
                                resourceID: "",
                            },
                        },
                        {
                            credentials: {
                                type: "nonexistent",
                                resourceID: "res-2",
                            },
                        },
                    ],
                    relations: { credentials: true },
                })
                expect(users.length).to.be.greaterThanOrEqual(1)
                expect(users[0].credentials).to.be.an("array")
            }),
        ))

    it("(2h) should find child with array where conditions (OR) on parent columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user1 = await insertUser(
                    connection,
                    "alice",
                    "alice@example.com",
                )
                await insertUser(
                    connection,
                    "bob",
                    "bob@example.com",
                )

                const users = await connection.getRepository(User).find({
                    where: [
                        { id: In([user1.id]) },
                        { nameID: In(["bob"]) },
                    ],
                })
                expect(users).to.have.length(2)
            }),
        ))

    it("(2i) should findOneOrFail on child entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@example.com",
                )

                const user = await connection.manager.findOneOrFail(User, {
                    where: { id: saved.id },
                })
                expect(user.id).to.equal(saved.id)
                expect(user.email).to.equal("alice@example.com")
            }),
        ))
})
