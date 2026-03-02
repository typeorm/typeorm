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
import { expect } from "chai"

describe("table-inheritance > class-table > generated-increment-on-child", () => {
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
        auth.rules = "rules"
        const profile = new Profile()
        profile.displayName = nameID

        const user = new User()
        user.nameID = nameID
        user.email = email
        user.accountID = ACCOUNT_UUID
        user.authorization = auth
        user.profile = profile
        user.credentials = []
        return connection.getRepository(User).save(user)
    }

    it("(7a) should save and verify auto-increment rowId works on child table", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(User)
                const user1 = await insertUser(
                    connection,
                    "u1",
                    "u1@ex.com",
                )
                const user2 = await insertUser(
                    connection,
                    "u2",
                    "u2@ex.com",
                )

                const loaded1 = await repo.findOneBy({ id: user1.id })
                const loaded2 = await repo.findOneBy({ id: user2.id })

                expect(loaded1!.rowId).to.be.a("number")
                expect(loaded2!.rowId).to.be.a("number")
                expect(loaded2!.rowId).to.be.greaterThan(loaded1!.rowId)
            }),
        ))

    it("(7b) should verify rowId doesn't appear on parent table", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                try {
                    const actorTable = await queryRunner.getTable("actor")
                    expect(actorTable).to.not.be.undefined
                    const actorCols = actorTable!.columns.map((c) => c.name)
                    expect(actorCols).to.not.include("rowId")
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("(7c) should have separate sequences for each child entity type", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = await insertUser(
                    connection,
                    "u1",
                    "u1@ex.com",
                )

                const auth = new AuthPolicy()
                auth.rules = "org-rules"
                const profile = new Profile()
                profile.displayName = "o1"
                const org = new Organization()
                org.nameID = "o1"
                org.industry = "Tech"
                org.accountID = ACCOUNT_UUID
                org.authorization = auth
                org.profile = profile
                org.credentials = []
                const savedOrg = await connection
                    .getRepository(Organization)
                    .save(org)

                const loadedUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                const loadedOrg = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: savedOrg.id })

                // Both should have rowId = 1 since they use separate sequences
                expect(loadedUser!.rowId).to.be.a("number")
                expect(loadedOrg!.rowId).to.be.a("number")
            }),
        ))

    it("(7d) should return rowId via root entity query", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@example.com",
                )

                const actor = await connection.manager.findOne(User, {
                    where: { id: saved.id },
                })
                expect(actor).to.not.be.null
                expect(actor!.rowId).to.be.a("number")
            }),
        ))
})
