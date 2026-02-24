import "reflect-metadata"
import "../../../utils/test-setup"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Actor } from "./entity/Actor"
import { User } from "./entity/User"
import { Organization } from "./entity/Organization"

describe("relations > one-to-one shared primary key (cascade)", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should cascade-insert Actor when saving User with shared PK", () =>
        Promise.all(
            connections.map(async (connection) => {
                const actor = new Actor()
                actor.type = "user"

                const user = new User()
                user.email = "alice@example.com"
                user.actor = actor

                // This should cascade: insert Actor first, then User
                // (User.id = Actor.id, so Actor must exist before User).
                const savedUser = await connection.manager.save(user)

                expect(savedUser.id).to.not.be.undefined
                expect(savedUser.id).to.not.be.null
                expect(savedUser.email).to.equal("alice@example.com")

                // Verify Actor was persisted
                const loadedActor = await connection.manager.findOneBy(Actor, {
                    id: savedUser.id,
                })
                expect(loadedActor).to.not.be.null
                expect(loadedActor!.type).to.equal("user")

                // Verify User was persisted with the same ID
                const loadedUser = await connection.manager.findOne(User, {
                    where: { email: "alice@example.com" },
                })
                expect(loadedUser).to.not.be.null
                expect(loadedUser!.id).to.equal(savedUser.id)
                // Eager relation should load Actor
                expect(loadedUser!.actor).to.not.be.undefined
                expect(loadedUser!.actor).to.not.be.null
                expect(loadedUser!.actor.type).to.equal("user")
            }),
        ))

    it("should cascade-insert Actor when saving Organization with shared PK", () =>
        Promise.all(
            connections.map(async (connection) => {
                const actor = new Actor()
                actor.type = "organization"

                const org = new Organization()
                org.legalName = "Acme Corp"
                org.actor = actor

                const savedOrg = await connection.manager.save(org)

                expect(savedOrg.id).to.not.be.undefined
                expect(savedOrg.id).to.not.be.null
                expect(savedOrg.legalName).to.equal("Acme Corp")

                // Verify Actor was persisted
                const loadedActor = await connection.manager.findOneBy(Actor, {
                    id: savedOrg.id,
                })
                expect(loadedActor).to.not.be.null
                expect(loadedActor!.type).to.equal("organization")

                // Verify Organization was persisted with the same ID
                const loadedOrg = await connection.manager.findOne(
                    Organization,
                    { where: { legalName: "Acme Corp" } },
                )
                expect(loadedOrg).to.not.be.null
                expect(loadedOrg!.id).to.equal(savedOrg.id)
                expect(loadedOrg!.actor).to.not.be.null
                expect(loadedOrg!.actor.type).to.equal("organization")
            }),
        ))

    it("should allow multiple entity types to share PK with Actor", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Create a User and Organization, each with their own Actor
                const userActor = new Actor()
                userActor.type = "user"
                const user = new User()
                user.email = "bob@example.com"
                user.actor = userActor

                const orgActor = new Actor()
                orgActor.type = "organization"
                const org = new Organization()
                org.legalName = "Widget Inc"
                org.actor = orgActor

                const savedUser = await connection.manager.save(user)
                const savedOrg = await connection.manager.save(org)

                // They should have different IDs
                expect(savedUser.id).to.not.equal(savedOrg.id)

                // Both Actors should exist
                const actors = await connection.manager.find(Actor, {
                    order: { type: "ASC" },
                })
                expect(actors).to.have.length(2)
                expect(actors[0].type).to.equal("organization")
                expect(actors[1].type).to.equal("user")
            }),
        ))
})
