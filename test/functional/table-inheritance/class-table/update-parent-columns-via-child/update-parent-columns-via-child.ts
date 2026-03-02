import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { AuthPolicy } from "./entity/AuthPolicy"
import { Profile } from "./entity/Profile"
import { expect } from "chai"

describe("table-inheritance > class-table > update-parent-columns-via-child", () => {
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

        const user = new User()
        user.nameID = nameID
        user.email = email
        user.accountID = ACCOUNT_UUID
        user.authorization = auth
        user.profile = profile
        user.credentials = []
        return connection.getRepository(User).save(user)
    }

    it("(8a) should update parent-table column via child save", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(User)
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@example.com",
                )

                const user = await repo.findOneBy({ id: saved.id })
                user!.nameID = "updated-name"
                await repo.save(user!)

                const reloaded = await repo.findOneBy({ id: saved.id })
                expect(reloaded!.nameID).to.equal("updated-name")
                expect(reloaded!.email).to.equal("alice@example.com")
            }),
        ))

    it("(8b) should update child-table column", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(User)
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@example.com",
                )

                const user = await repo.findOneBy({ id: saved.id })
                user!.email = "newalice@example.com"
                await repo.save(user!)

                const reloaded = await repo.findOneBy({ id: saved.id })
                expect(reloaded!.email).to.equal("newalice@example.com")
                expect(reloaded!.nameID).to.equal("alice")
            }),
        ))

    it("(8c) should update both parent and child columns simultaneously", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(User)
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@example.com",
                )

                const user = await repo.findOneBy({ id: saved.id })
                user!.nameID = "final-name"
                user!.email = "final@example.com"
                await repo.save(user!)

                const reloaded = await repo.findOneBy({ id: saved.id })
                expect(reloaded!.nameID).to.equal("final-name")
                expect(reloaded!.email).to.equal("final@example.com")
            }),
        ))

    it("(8d) should increment version after parent-column update", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(User)
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@example.com",
                )
                expect(saved.version).to.equal(1)

                const user = await repo.findOneBy({ id: saved.id })
                user!.nameID = "updated"
                await repo.save(user!)

                const reloaded = await repo.findOneBy({ id: saved.id })
                expect(reloaded!.version).to.equal(2)
            }),
        ))

    it("(8e) should increment version after child-column update", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(User)
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@example.com",
                )

                const user = await repo.findOneBy({ id: saved.id })
                user!.email = "new@example.com"
                await repo.save(user!)

                const reloaded = await repo.findOneBy({ id: saved.id })
                expect(reloaded!.version).to.equal(2)
            }),
        ))
})
