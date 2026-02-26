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
import { UserSettings } from "./entity/UserSettings"
import { OrgVerification } from "./entity/OrgVerification"
import { expect } from "chai"

describe("table-inheritance > class-table > eager-scoping", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should eagerly load child-specific relation when querying that child", () =>
        Promise.all(
            connections.map(async (connection) => {
                const settings = new UserSettings()
                settings.theme = "dark"
                await connection.getRepository(UserSettings).save(settings)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.settings = settings
                await connection.getRepository(User).save(user)

                // Load without explicit relations option — should eagerly load settings
                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null
                expect(loaded!.settings).to.not.be.undefined
                expect(loaded!.settings).to.not.be.null
                expect(loaded!.settings.theme).to.equal("dark")
            }),
        ))

    it("should NOT eagerly load sibling's relation when querying a specific child", () =>
        Promise.all(
            connections.map(async (connection) => {
                const settings = new UserSettings()
                settings.theme = "dark"
                await connection.getRepository(UserSettings).save(settings)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.settings = settings
                await connection.getRepository(User).save(user)

                const verification = new OrgVerification()
                verification.verified = true
                await connection
                    .getRepository(OrgVerification)
                    .save(verification)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.verification = verification
                await connection.getRepository(Organization).save(org)

                // Load User — should NOT have verification
                const loadedUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(loadedUser).to.not.have.property("verification")

                // Load Organization — should NOT have settings
                const loadedOrg = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })
                expect(loadedOrg).to.not.have.property("settings")
            }),
        ))

    it("should load ALL eager relations when querying parent entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const settings = new UserSettings()
                settings.theme = "dark"
                await connection.getRepository(UserSettings).save(settings)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.settings = settings
                await connection.getRepository(User).save(user)

                const verification = new OrgVerification()
                verification.verified = true
                await connection
                    .getRepository(OrgVerification)
                    .save(verification)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.verification = verification
                await connection.getRepository(Organization).save(org)

                // Load all actors — each child should have its own eager relation
                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors).to.have.length(2)

                const loadedUser = actors[0] as User
                expect(loadedUser).to.be.instanceOf(User)
                expect(loadedUser.settings).to.not.be.undefined
                expect(loadedUser.settings.theme).to.equal("dark")

                const loadedOrg = actors[1] as Organization
                expect(loadedOrg).to.be.instanceOf(Organization)
                expect(loadedOrg.verification).to.not.be.undefined
                expect(loadedOrg.verification.verified).to.equal(true)
            }),
        ))
})
