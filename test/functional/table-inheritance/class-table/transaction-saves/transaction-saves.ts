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

describe("table-inheritance > class-table > transaction-saves", () => {
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

    it("(5a) should save child entity in transaction and read within same tx", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.manager.transaction(async (mgr) => {
                    const auth = new AuthPolicy()
                    auth.rules = "tx-rules"
                    const profile = new Profile()
                    profile.displayName = "tx-user"

                    const user = new User()
                    user.nameID = "tx-user"
                    user.email = "tx@example.com"
                    user.accountID = ACCOUNT_UUID
                    user.authorization = auth
                    user.profile = profile
                    user.credentials = []
                    const saved = await mgr.save(user)
                    expect(saved.id).to.be.a("string")

                    const loaded = await mgr.findOne(User, {
                        where: { id: saved.id },
                    })
                    expect(loaded).to.not.be.null
                    expect(loaded!.email).to.equal("tx@example.com")
                    expect(loaded!.nameID).to.equal("tx-user")
                })
            }),
        ))

    it("(5b) should save multiple CTI entities in same transaction", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.manager.transaction(async (mgr) => {
                    const auth1 = new AuthPolicy()
                    auth1.rules = "u-rules"
                    const profile1 = new Profile()
                    profile1.displayName = "u1"

                    const user = new User()
                    user.nameID = "u1"
                    user.email = "u1@ex.com"
                    user.accountID = ACCOUNT_UUID
                    user.authorization = auth1
                    user.profile = profile1
                    user.credentials = []
                    await mgr.save(user)

                    const auth2 = new AuthPolicy()
                    auth2.rules = "o-rules"
                    const profile2 = new Profile()
                    profile2.displayName = "o1"

                    const org = new Organization()
                    org.nameID = "o1"
                    org.industry = "Tech"
                    org.accountID = ACCOUNT_UUID
                    org.authorization = auth2
                    org.profile = profile2
                    org.credentials = []
                    await mgr.save(org)

                    const actors = await mgr.find(Actor, {
                        loadEagerRelations: false,
                    })
                    expect(actors).to.have.length(2)
                })
            }),
        ))

    it("(5c) should save child with cascaded credentials in transaction", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.manager.transaction(async (mgr) => {
                    const auth = new AuthPolicy()
                    auth.rules = "cascade-rules"
                    const profile = new Profile()
                    profile.displayName = "cascade-user"

                    const cred = new Credential()
                    cred.type = "admin"
                    cred.resourceID = "res-1"

                    const user = new User()
                    user.nameID = "cascade-user"
                    user.email = "cascade@example.com"
                    user.accountID = ACCOUNT_UUID
                    user.authorization = auth
                    user.profile = profile
                    user.credentials = [cred]
                    const saved = await mgr.save(user)

                    const loaded = await mgr.findOne(User, {
                        where: { id: saved.id },
                        relations: { credentials: true },
                    })
                    expect(loaded!.credentials).to.have.length(1)
                    expect(loaded!.credentials[0].type).to.equal("admin")
                })
            }),
        ))

    it("(5d) should rollback both parent and child tables on transaction failure", () =>
        Promise.all(
            connections.map(async (connection) => {
                let savedId: string | undefined
                try {
                    await connection.manager.transaction(async (mgr) => {
                        const auth = new AuthPolicy()
                        auth.rules = "rb-rules"
                        const profile = new Profile()
                        profile.displayName = "rollback"

                        const user = new User()
                        user.nameID = "rollback-user"
                        user.email = "rb@example.com"
                        user.accountID = ACCOUNT_UUID
                        user.authorization = auth
                        user.profile = profile
                        user.credentials = []
                        const saved = await mgr.save(user)
                        savedId = saved.id

                        throw new Error("force rollback")
                    })
                } catch (e) {
                    // expected
                }

                if (savedId) {
                    const ghost = await connection.manager.findOne(User, {
                        where: { id: savedId },
                    })
                    expect(ghost).to.be.null
                }
            }),
        ))
})
