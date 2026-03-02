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

describe("table-inheritance > class-table > delete-cti-entities", () => {
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

    it("(9a) should delete child entity — both tables cleaned up", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@example.com",
                )
                const userId = saved.id

                const repo = connection.getRepository(User)
                const user = await repo.findOneBy({ id: userId })
                await repo.remove(user!)

                // Verify both tables are clean
                const actorRows = await connection.query(
                    `SELECT * FROM "actor" WHERE "id" = $1`,
                    [userId],
                )
                expect(actorRows).to.have.length(0)

                const userRows = await connection.query(
                    `SELECT * FROM "user" WHERE "id" = $1`,
                    [userId],
                )
                expect(userRows).to.have.length(0)
            }),
        ))

    it("(9b) should delete child with cascaded credentials", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@example.com",
                )
                const userId = saved.id

                const repo = connection.getRepository(User)
                const user = await repo.findOneBy({ id: userId })
                await repo.remove(user!)

                const credCount = await connection
                    .getRepository(Credential)
                    .count()
                expect(credCount).to.equal(0)
            }),
        ))

    it("(9c) should delete within transaction", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertOrg(
                    connection,
                    "acme",
                    "Tech",
                )

                await connection.manager.transaction(async (mgr) => {
                    const org = await mgr.findOneOrFail(Organization, {
                        where: { id: saved.id },
                    })
                    await mgr.remove(org)

                    const gone = await mgr.findOne(Organization, {
                        where: { id: saved.id },
                    })
                    expect(gone).to.be.null
                })

                // Also confirm outside transaction
                const gone = await connection.manager.findOne(Organization, {
                    where: { id: saved.id },
                })
                expect(gone).to.be.null
            }),
        ))
})
